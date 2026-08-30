import { Department } from '../models/index.js';
import asyncHandler from '../utils/asyncHandler.js';

/**
 * GET /departments
 * Lightweight read-only list used to populate dropdowns (e.g. the employee
 * form). Full department CRUD arrives in Task 6; this endpoint is intentionally
 * minimal - active departments, sorted for display, no pagination needed for
 * the small number of departments a company has.
 */
export const listDepartments = asyncHandler(async (req, res) => {
  const departments = await Department.find({ isActive: true })
    .select('name code description location extension sortOrder')
    .sort({ sortOrder: 1, name: 1 });

  res.status(200).json({ success: true, data: departments });
});
