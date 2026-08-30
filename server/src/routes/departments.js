import { Router } from 'express';
import {
  listDepartments,
  getDepartment,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} from '../controllers/departmentController.js';
import {
  createDepartmentValidator,
  updateDepartmentValidator,
  departmentIdValidator,
} from '../validators/departmentValidators.js';
import validate from '../middleware/validate.js';
import { authenticate, requirePermission } from '../middleware/auth.js';

const router = Router();

// Reads remain available to every authenticated role.
router.use(authenticate);
router.get('/', listDepartments);
router.get('/:id', departmentIdValidator, validate, getDepartment);

// Writes are restricted to the centralized departments:manage permission.
router.post('/', requirePermission('departments:manage'), createDepartmentValidator, validate, createDepartment);
router.patch('/:id', requirePermission('departments:manage'), updateDepartmentValidator, validate, updateDepartment);
router.delete('/:id', requirePermission('departments:manage'), departmentIdValidator, validate, deleteDepartment);

export default router;
