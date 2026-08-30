import { Department, Employee, Intern, AuditLog } from '../models/index.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import { can } from '../config/permissions.js';

const MANAGER_PROJECTION = 'firstName lastName employeeCode position departmentId';
const EMPLOYEE_PROJECTION = 'employeeCode firstName lastName nickname position departmentId managerId isActive isPublished';
const INTERN_PROJECTION = 'firstName lastName nickname university major departmentId mentorId batchId startDate endDate isPublished';

const canManage = (req) => can(req.user.role, 'departments:manage');

const visibilityFilter = (req, field = 'isPublished') =>
  canManage(req) ? {} : { [field]: true };

const serializeDepartment = (department, employeeCount, internCount) => ({
  ...department.toObject({ virtuals: false }),
  employeeCount,
  internCount,
});

const getCounts = async (departmentId, req) => {
  const employeeFilter = { departmentId, ...visibilityFilter(req) };
  const internFilter = { departmentId, ...visibilityFilter(req) };
  const [employeeCount, internCount] = await Promise.all([
    Employee.countDocuments(employeeFilter),
    Intern.countDocuments(internFilter),
  ]);
  return { employeeCount, internCount };
};

const assertManagerForDepartment = async (managerId, departmentId) => {
  if (!managerId) return;

  const manager = await Employee.findById(managerId).select('departmentId isActive');
  if (!manager) {
    throw ApiError.badRequest('The specified manager does not exist');
  }
  if (String(manager.departmentId) !== String(departmentId)) {
    throw ApiError.badRequest('The department manager must belong to this department', {
      managerId: 'Manager must be assigned to an employee in this department',
    });
  }
  if (!manager.isActive) {
    throw ApiError.badRequest('An inactive employee cannot be a department manager', {
      managerId: 'Manager must be active',
    });
  }
};

const departmentFilterFor = (req) => (canManage(req) ? {} : { isActive: true });

/**
 * GET /departments
 * Authenticated users see active departments. Admins also see inactive
 * departments for management, with explicit employee and intern counts.
 */
export const listDepartments = asyncHandler(async (req, res) => {
  const departments = await Department.find(departmentFilterFor(req))
    .populate('managerId', MANAGER_PROJECTION)
    .sort({ sortOrder: 1, name: 1 });

  const data = await Promise.all(
    departments.map(async (department) => {
      const { employeeCount, internCount } = await getCounts(department._id, req);
      return serializeDepartment(department, employeeCount, internCount);
    })
  );

  res.status(200).json({ success: true, data });
});

/**
 * GET /departments/:id
 * Returns the department, manager, visible members, and explicit counts.
 */
export const getDepartment = asyncHandler(async (req, res) => {
  const department = await Department.findOne({ _id: req.params.id, ...departmentFilterFor(req) })
    .populate('managerId', MANAGER_PROJECTION);

  if (!department) throw ApiError.notFound('Department not found');

  const employeeFilter = { departmentId: department._id, ...visibilityFilter(req) };
  const internFilter = { departmentId: department._id, ...visibilityFilter(req) };
  const [employees, interns] = await Promise.all([
    Employee.find(employeeFilter)
      .select(EMPLOYEE_PROJECTION)
      .populate('managerId', 'firstName lastName employeeCode')
      .sort({ lastName: 1, firstName: 1 }),
    Intern.find(internFilter)
      .select(INTERN_PROJECTION)
      .populate('mentorId', 'firstName lastName employeeCode')
      .sort({ lastName: 1, firstName: 1 }),
  ]);

  const data = serializeDepartment(department, employees.length, interns.length);
  data.employees = employees;
  data.interns = interns;

  res.status(200).json({ success: true, data: { department: data } });
});

/** POST /departments */
export const createDepartment = asyncHandler(async (req, res) => {
  // A new department cannot have a manager yet because no employee can belong
  // to it until it has been created. Assign the manager on a subsequent PATCH.
  if (req.body.managerId) {
    throw ApiError.badRequest('Create the department first, then assign a manager after adding an employee to it', {
      managerId: 'Manager assignment is available when editing a department',
    });
  }

  const department = await Department.create(req.body);
  const { employeeCount, internCount } = await getCounts(department._id, req);

  await AuditLog.record({
    userId: req.user.id,
    action: 'create',
    entity: 'Department',
    entityId: department._id,
    after: department.toObject(),
    ip: req.ip,
    userAgent: req.get('user-agent') || '',
  });

  res.status(201).json({
    success: true,
    data: { department: serializeDepartment(department, employeeCount, internCount) },
  });
});

const UPDATABLE_FIELDS = [
  'name',
  'code',
  'description',
  'responsibilities',
  'contactTopics',
  'managerId',
  'location',
  'extension',
  'sortOrder',
  'isActive',
];

/** PATCH /departments/:id */
export const updateDepartment = asyncHandler(async (req, res) => {
  const department = await Department.findById(req.params.id);
  if (!department) throw ApiError.notFound('Department not found');

  const before = department.toObject();
  const nextManagerId = Object.prototype.hasOwnProperty.call(req.body, 'managerId')
    ? req.body.managerId
    : department.managerId;

  await assertManagerForDepartment(nextManagerId, department._id);

  for (const field of UPDATABLE_FIELDS) {
    if (field in req.body) department[field] = req.body[field];
  }

  await department.save();
  await department.populate('managerId', MANAGER_PROJECTION);
  const { employeeCount, internCount } = await getCounts(department._id, req);

  await AuditLog.record({
    userId: req.user.id,
    action: 'update',
    entity: 'Department',
    entityId: department._id,
    before,
    after: department.toObject(),
    ip: req.ip,
    userAgent: req.get('user-agent') || '',
  });

  res.status(200).json({
    success: true,
    data: { department: serializeDepartment(department, employeeCount, internCount) },
  });
});

/** DELETE /departments/:id - protected against orphaning employees or interns. */
export const deleteDepartment = asyncHandler(async (req, res) => {
  const department = await Department.findById(req.params.id);
  if (!department) throw ApiError.notFound('Department not found');

  const [employeeCount, internCount] = await Promise.all([
    Employee.countDocuments({ departmentId: department._id }),
    Intern.countDocuments({ departmentId: department._id }),
  ]);

  if (employeeCount || internCount) {
    throw ApiError.conflict(
      `Cannot delete a non-empty department (${employeeCount} employee${employeeCount === 1 ? '' : 's'}, ${internCount} intern${internCount === 1 ? '' : 's'} remain)`
    );
  }

  const before = department.toObject();
  await department.deleteOne();

  await AuditLog.record({
    userId: req.user.id,
    action: 'delete',
    entity: 'Department',
    entityId: req.params.id,
    before,
    ip: req.ip,
    userAgent: req.get('user-agent') || '',
  });

  res.status(200).json({ success: true, message: 'Department deleted' });
});
