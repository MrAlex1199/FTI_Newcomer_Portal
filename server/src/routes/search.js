import { Router } from 'express';
import { globalSearch } from '../controllers/searchController.js';
import { searchValidator } from '../validators/searchValidators.js';
import validate from '../middleware/validate.js';
import { authenticate, requirePermission } from '../middleware/auth.js';

const router = Router();
router.use(authenticate, requirePermission('search:view'));
router.get('/', searchValidator, validate, globalSearch);

export default router;
