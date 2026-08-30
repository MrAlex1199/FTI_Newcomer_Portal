import { Employee, AuditLog } from '../models/index.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { can } from '../config/permissions.js';
import {
  DEFAULT_MAX_DEPTH,
  assertManagerAssignment,
  getOrganizationTree,
  invalidateOrganizationTreeCache,
} from '../services/reportingService.js';

const parseMaxDepth = (query) => Number(query.maxDepth ?? query.depth ?? DEFAULT_MAX_DEPTH);

export const organizationTree = asyncHandler(async (req, res) => {
  const departmentId = req.query.department || req.query.departmentId || null;
  const tree = await getOrganizationTree({
    departmentId,
    includeUnpublished: can(req.user.role, 'employees:manage'),
    maxDepth: parseMaxDepth(req.query),
  });

  res.status(200).json({ success: true, data: tree });
});

export const updateReportingStructure = asyncHandler(async (req, res) => {
  const employee = await Employee.findById(req.params.employeeId);
  if (!employee) throw ApiError.notFound('Employee not found');

  const before = employee.toObject();
  const managerId = req.body.managerId || null;
  await assertManagerAssignment({ employeeId: employee._id, managerId });

  employee.managerId = managerId;
  await employee.save();
  invalidateOrganizationTreeCache();
  await employee.populate('departmentId', 'name code');
  await employee.populate('managerId', 'firstName lastName employeeCode position');

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

  res.status(200).json({ success: true, data: { employee } });
});
