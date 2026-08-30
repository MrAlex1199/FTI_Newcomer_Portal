import { Employee, Department, Intern, AuditLog } from '../models/index.js';
import { deleteImage, uploadImage } from '../utils/imageUpload.js';
import { assertManagerAssignment, invalidateOrganizationTreeCache } from '../services/reportingService.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { parsePagination, paginatedResponse } from '../utils/pagination.js';
import { can } from '../config/permissions.js';

const SORT_FIELDS = ['createdAt', 'lastName', 'firstName', 'employeeCode', 'position'];

/** Roles that may see unpublished employees and manage records. */
const isManager = (role) => can(role, 'employees:manage');

/** Confirm a department exists before pointing an employee at it. */
const assertDepartmentExists = async (departmentId) => {
  const exists = await Department.exists({ _id: departmentId });
  if (!exists) {
    throw ApiError.badRequest('The specified department does not exist');
  }
};

/**
 * GET /employees
 * Search (MongoDB text index), filter by department/status/published, sort,
 * paginate. Non-managers are always restricted to published records regardless
 * of the `published` query param.
 */
export const listEmployees = asyncHandler(async (req, res) => {
  const { page, limit, skip, sort } = parsePagination(req.query, {
    allowedSortFields: SORT_FIELDS,
    defaultSort: { lastName: 1, firstName: 1 },
  });

  const filter = {};

  if (req.query.search) {
    filter.$text = { $search: req.query.search };
  }
  if (req.query.department) {
    filter.departmentId = req.query.department;
  }
  if (req.query.status === 'active') filter.isActive = true;
  if (req.query.status === 'inactive') filter.isActive = false;

  // Visibility: only managers may view unpublished records. Everyone else is
  // hard-limited to published, no matter what they pass in `published`.
  if (isManager(req.user.role)) {
    if (req.query.published === 'true') filter.isPublished = true;
    if (req.query.published === 'false') filter.isPublished = false;
  } else {
    filter.isPublished = true;
  }

  const [data, total] = await Promise.all([
    Employee.find(filter)
      .populate('departmentId', 'name code')
      .populate('managerId', 'firstName lastName employeeCode')
      .sort(sort)
      .skip(skip)
      .limit(limit),
    Employee.countDocuments(filter),
  ]);

  res.status(200).json(paginatedResponse({ data, page, limit, total }));
});

/**
 * GET /employees/:id
 * Non-managers cannot fetch an unpublished record (404 rather than 403 so the
 * existence of hidden records isn't revealed).
 */
export const getEmployee = asyncHandler(async (req, res) => {
  const employee = await Employee.findById(req.params.id)
    .populate('departmentId', 'name code')
    .populate('managerId', 'firstName lastName employeeCode');

  if (!employee || (!isManager(req.user.role) && !employee.isPublished)) {
    throw ApiError.notFound('Employee not found');
  }

  res.status(200).json({ success: true, data: { employee } });
});

const pickEmployeeFields = (body) => Object.fromEntries(
  UPDATABLE_FIELDS.filter((field) => field in body).map((field) => [field, body[field]])
);

/**
 * POST /employees
 * Validates referenced department/manager exist, then creates. Duplicate
 * employeeCode is caught by the unique index and surfaced as 409 by the
 * global error handler.
 */
export const createEmployee = asyncHandler(async (req, res) => {
  const payload = pickEmployeeFields(req.body);
  await assertDepartmentExists(payload.departmentId);
  await assertManagerAssignment({ managerId: payload.managerId });

  let uploaded;
  let employee;
  try {
    if (req.file) uploaded = await uploadImage(req.file.buffer, 'fti-welcome-hub/employees');
    employee = await Employee.create({
      ...payload,
      ...(uploaded && { profileImage: uploaded.url, profileImagePublicId: uploaded.publicId }),
    });
    await employee.populate('departmentId', 'name code');

    await AuditLog.record({
      userId: req.user.id,
      action: 'create',
      entity: 'Employee',
      entityId: employee._id,
      after: employee.toObject(),
      ip: req.ip,
      userAgent: req.get('user-agent') || '',
    });
    invalidateOrganizationTreeCache();

    res.status(201).json({ success: true, data: { employee } });
  } catch (error) {
    // If persistence never created a record, the uploaded asset is orphaned.
    if (uploaded && !employee) await deleteImage(uploaded.publicId);
    throw error;
  }
});

// Fields a client is allowed to change. Anything else in the body is ignored,
// so a caller can't set arbitrary/internal fields via mass assignment.
const UPDATABLE_FIELDS = [
  'employeeCode',
  'firstName',
  'lastName',
  'nickname',
  'position',
  'departmentId',
  'managerId',
  'workEmail',
  'extension',
  'officeLocation',
  'bio',
  'skills',
  'contactVisibility',
  'isPublished',
  'isActive',
];

/**
 * PATCH /employees/:id
 * Applies only whitelisted fields. Re-validates department/manager references
 * when they change, and blocks an employee being set as their own manager.
 */
export const updateEmployee = asyncHandler(async (req, res) => {
  const employee = await Employee.findById(req.params.id).select('+profileImagePublicId');
  if (!employee) {
    throw ApiError.notFound('Employee not found');
  }

  const before = employee.toObject();
  const previousDepartmentId = String(employee.departmentId);
  const payload = pickEmployeeFields(req.body);
  const nextManagerId = Object.prototype.hasOwnProperty.call(payload, 'managerId')
    ? payload.managerId
    : employee.managerId;

  if (payload.departmentId && payload.departmentId !== String(employee.departmentId)) {
    await assertDepartmentExists(payload.departmentId);
  }
  await assertManagerAssignment({ employeeId: employee._id, managerId: nextManagerId });

  for (const field of UPDATABLE_FIELDS) {
    if (field in payload) employee[field] = payload[field];
  }

  let uploaded;
  let saved = false;
  try {
    if (req.file) uploaded = await uploadImage(req.file.buffer, 'fti-welcome-hub/employees');
    if (uploaded) {
      employee.profileImage = uploaded.url;
      employee.profileImagePublicId = uploaded.publicId;
    }

    await employee.save();
    saved = true;
    invalidateOrganizationTreeCache();

    if (String(employee.departmentId) !== previousDepartmentId) {
      await Department.updateOne(
        { _id: previousDepartmentId, managerId: employee._id },
        { $set: { managerId: null } }
      );
    }

    await employee.populate('departmentId', 'name code');
    await employee.populate('managerId', 'firstName lastName employeeCode');

    await AuditLog.record({
      userId: req.user.id,
      action: 'update',
      entity: 'Employee',
      entityId: employee._id,
      before,
      after: employee.toObject(),
      ip: req.ip,
      userAgent: req.get('user-agent') || '',
    });

    if (uploaded && before.profileImagePublicId) await deleteImage(before.profileImagePublicId);
    res.status(200).json({ success: true, data: { employee } });
  } catch (error) {
    if (uploaded && !saved) await deleteImage(uploaded.publicId);
    throw error;
  }
});

/**
 * DELETE /employees/:id
 * Hard delete. Any interns mentored by this employee have their mentorId
 * cleared so we don't leave dangling references (the reference becomes null,
 * which the intern schema permits).
 */
export const deleteEmployee = asyncHandler(async (req, res) => {
  const employee = await Employee.findById(req.params.id).select('+profileImagePublicId');
  if (!employee) {
    throw ApiError.notFound('Employee not found');
  }

  const before = employee.toObject();

  // Clear dangling references so no intern points at a deleted mentor and no
  // employee points at a deleted manager. Both fields are nullable.
  await Promise.all([
    Intern.updateMany({ mentorId: employee._id }, { $set: { mentorId: null } }),
    Employee.updateMany({ managerId: employee._id }, { $set: { managerId: null } }),
    Department.updateMany({ managerId: employee._id }, { $set: { managerId: null } }),
  ]);

  await employee.deleteOne();
  await deleteImage(employee.profileImagePublicId);
  invalidateOrganizationTreeCache();

  await AuditLog.record({
    userId: req.user.id,
    action: 'delete',
    entity: 'Employee',
    entityId: req.params.id,
    before,
    ip: req.ip,
    userAgent: req.get('user-agent') || '',
  });

  res.status(200).json({ success: true, message: 'Employee deleted' });
});
