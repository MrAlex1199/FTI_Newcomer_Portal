import { Router } from 'express';
import { listDepartments } from '../controllers/departmentController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Read-only for any authenticated user. Management endpoints added in Task 6.
router.use(authenticate);
router.get('/', listDepartments);

export default router;
