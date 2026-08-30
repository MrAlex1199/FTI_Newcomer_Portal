import mongoose from 'mongoose';
import { Employee, Department } from '../models/index.js';
import ApiError from '../utils/ApiError.js';

export const DEFAULT_MAX_DEPTH = 10;
export const MAX_MAX_DEPTH = 20;
const CACHE_TTL_MS = 30_000;
const treeRecordCache = new Map();

const normalizeId = (value) => (value ? String(value) : null);

const cacheKeyFor = ({ departmentId, includeUnpublished }) => `${departmentId || 'all'}:${includeUnpublished ? 'all' : 'published'}`;

const loadOrganizationRecords = async ({ departmentId, includeUnpublished }) => {
  const key = cacheKeyFor({ departmentId, includeUnpublished });
  const cached = treeRecordCache.get(key);
  if (cached && cached.expiresAt > Date.now()) return { records: cached.records, cacheHit: true };
  if (cached) treeRecordCache.delete(key);

  const match = {};
  if (departmentId) match.departmentId = new mongoose.Types.ObjectId(departmentId);
  if (!includeUnpublished) match.isPublished = true;

  const records = await Employee.aggregate([
    { $match: match },
    {
      $lookup: {
        from: Department.collection.name,
        localField: 'departmentId',
        foreignField: '_id',
        as: 'department',
      },
    },
    { $unwind: { path: '$department', preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id: 1,
        employeeCode: 1,
        firstName: 1,
        lastName: 1,
        nickname: 1,
        position: 1,
        managerId: 1,
        profileImage: 1,
        isActive: 1,
        isPublished: 1,
        department: {
          id: '$department._id',
          name: '$department.name',
          code: '$department.code',
        },
      },
    },
    { $sort: { lastName: 1, firstName: 1, employeeCode: 1 } },
  ]);

  treeRecordCache.set(key, { records, expiresAt: Date.now() + CACHE_TTL_MS });
  return { records, cacheHit: false };
};

export const invalidateOrganizationTreeCache = () => treeRecordCache.clear();

const serializeRecord = (record) => ({
  id: String(record._id),
  employeeCode: record.employeeCode,
  firstName: record.firstName,
  lastName: record.lastName,
  nickname: record.nickname || '',
  fullName: `${record.firstName || ''} ${record.lastName || ''}`.trim(),
  position: record.position,
  managerId: normalizeId(record.managerId),
  profileImage: record.profileImage || '',
  isActive: record.isActive,
  isPublished: record.isPublished,
  department: record.department?.id
    ? {
        id: String(record.department.id),
        name: record.department.name,
        code: record.department.code,
      }
    : null,
  children: [],
});

const detectCycleNodes = (recordsById) => {
  const cycleNodes = new Set();

  for (const startId of recordsById.keys()) {
    const path = [];
    const positions = new Map();
    let currentId = startId;

    while (currentId && recordsById.has(currentId)) {
      if (positions.has(currentId)) {
        const cycleStart = positions.get(currentId);
        path.slice(cycleStart).forEach((id) => cycleNodes.add(id));
        break;
      }
      positions.set(currentId, path.length);
      path.push(currentId);
      currentId = normalizeId(recordsById.get(currentId).managerId);
    }
  }

  return cycleNodes;
};

/**
 * Build one bounded nested tree from a single employee snapshot. Null manager
 * records are legitimate roots; records whose manager is unavailable or part
 * of a cycle are returned separately as orphan roots.
 */
export const buildOrganizationTree = (records, { maxDepth = DEFAULT_MAX_DEPTH, departmentId = null } = {}) => {
  const recordsById = new Map(records.map((record) => [String(record._id), record]));
  const childrenByManager = new Map();
  const cycleNodes = detectCycleNodes(recordsById);

  for (const record of records) {
    const managerId = normalizeId(record.managerId);
    if (!managerId || !recordsById.has(managerId)) continue;
    if (!childrenByManager.has(managerId)) childrenByManager.set(managerId, []);
    childrenByManager.get(managerId).push(String(record._id));
  }

  const orphanReasons = new Map();
  for (const record of records) {
    const id = String(record._id);
    const managerId = normalizeId(record.managerId);
    if (cycleNodes.has(id)) orphanReasons.set(id, 'circular_reference');
    else if (managerId && !recordsById.has(managerId)) orphanReasons.set(id, 'manager_not_available');
  }

  const truncatedEmployeeIds = new Set();
  const rendered = new Set();

  const buildNode = (id, depth, path, orphanReason = null) => {
    if (path.has(id) || rendered.has(id)) return null;
    const record = recordsById.get(id);
    if (!record) return null;

    rendered.add(id);
    const node = serializeRecord(record);
    if (orphanReason) node.orphanReason = orphanReason;

    const childIds = (childrenByManager.get(id) || [])
      .filter((childId) => !cycleNodes.has(childId))
      .sort((left, right) => {
        const a = recordsById.get(left);
        const b = recordsById.get(right);
        return `${a.lastName} ${a.firstName} ${a.employeeCode}`.localeCompare(`${b.lastName} ${b.firstName} ${b.employeeCode}`);
      });

    if (childIds.length && depth >= maxDepth - 1) {
      node.childrenTruncated = true;
      node.directReportCount = childIds.length;
      childIds.forEach((childId) => truncatedEmployeeIds.add(childId));
      return node;
    }

    const nextPath = new Set(path);
    nextPath.add(id);
    node.children = childIds
      .map((childId) => buildNode(childId, depth + 1, nextPath))
      .filter(Boolean);
    return node;
  };

  const topIds = records
    .filter((record) => {
      const id = String(record._id);
      const managerId = normalizeId(record.managerId);
      return !managerId || !recordsById.has(managerId) || cycleNodes.has(id);
    })
    .map((record) => String(record._id));

  const roots = [];
  const orphans = [];
  for (const id of topIds) {
    const node = buildNode(id, 0, new Set(), orphanReasons.get(id) || null);
    if (!node) continue;
    if (orphanReasons.has(id)) orphans.push(node);
    else roots.push(node);
  }

  return {
    roots,
    orphans,
    meta: {
      total: records.length,
      rootCount: roots.length,
      orphanCount: orphans.length,
      cycleNodeCount: [...cycleNodes].length,
      maxDepth,
      truncated: truncatedEmployeeIds.size > 0,
      truncatedEmployeeIds: [...truncatedEmployeeIds],
      departmentId,
    },
  };
};

export const getOrganizationTree = async ({ departmentId = null, includeUnpublished = false, maxDepth = DEFAULT_MAX_DEPTH }) => {
  const { records, cacheHit } = await loadOrganizationRecords({ departmentId, includeUnpublished });
  const tree = buildOrganizationTree(records, { maxDepth, departmentId });
  tree.meta.cacheHit = cacheHit;
  return tree;
};

/** Validate a manager target and reject self-links, inactive managers, and cycles. */
export const assertManagerAssignment = async ({ employeeId = null, managerId = null }) => {
  if (!managerId) return null;

  const manager = await Employee.findById(managerId).select('_id managerId isActive');
  if (!manager) throw ApiError.badRequest('The specified manager does not exist', { managerId: 'Manager must exist' });
  if (!manager.isActive) throw ApiError.badRequest('An inactive employee cannot be assigned as manager', { managerId: 'Manager must be active' });
  if (employeeId && String(manager._id) === String(employeeId)) {
    throw ApiError.conflict('An employee cannot be their own manager');
  }

  if (!employeeId) return manager;

  const visited = new Set();
  let current = manager;
  while (current) {
    const currentId = String(current._id);
    if (currentId === String(employeeId)) {
      throw ApiError.conflict('The reporting change would create a circular relationship');
    }
    if (visited.has(currentId)) {
      throw ApiError.conflict('The existing reporting structure contains a circular relationship');
    }
    visited.add(currentId);
    if (!current.managerId) break;
    current = await Employee.findById(current.managerId).select('_id managerId');
  }

  return manager;
};
