import { Router } from 'express';
import {
  getFacilities,
  createFacility,
  updateFacility,
  deleteFacility,
  addFloor,
  deleteFloor,
} from '../controllers/facilityController.js';
import { authenticate, requirePermission, authorize } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

// View facilities (all authenticated users)
router.get('/', requirePermission('organization:view'), getFacilities);

// Create / Edit facilities & floors (knowledge:manage or admin)
router.post('/', requirePermission('knowledge:manage'), createFacility);
router.put('/:id', requirePermission('knowledge:manage'), updateFacility);
router.post('/:id/floors', requirePermission('knowledge:manage'), addFloor);
router.delete('/:id/floors/:floorNumber', requirePermission('knowledge:manage'), deleteFloor);

// Delete facility (Super admin / Admin only)
router.delete('/:id', authorize('admin', 'super_admin'), deleteFacility);

export default router;
