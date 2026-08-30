import { Router } from 'express';
import {
  listEmployees,
  getEmployee,
  createEmployee,
  updateEmployee,
  deleteEmployee,
} from '../controllers/employeeController.js';
import {
  createEmployeeValidator,
  updateEmployeeValidator,
  employeeIdValidator,
  listEmployeesValidator,
} from '../validators/employeeValidators.js';
import validate from '../middleware/validate.js';
import { authenticate, requirePermission } from '../middleware/auth.js';

const router = Router();

// Every employee route requires a session.
router.use(authenticate);

// Read: any authenticated role (employees:view). Visibility of unpublished
// records is further narrowed inside the controller.
router.get('/', requirePermission('employees:view'), listEmployeesValidator, validate, listEmployees);
router.get('/:id', requirePermission('employees:view'), employeeIdValidator, validate, getEmployee);

// Write: admins only (employees:manage).
router.post('/', requirePermission('employees:manage'), createEmployeeValidator, validate, createEmployee);
router.patch('/:id', requirePermission('employees:manage'), updateEmployeeValidator, validate, updateEmployee);
router.delete('/:id', requirePermission('employees:manage'), employeeIdValidator, validate, deleteEmployee);

export default router;
