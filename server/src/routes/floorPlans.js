import { Router } from 'express';
import {
  getFloorPlans,
  getFloorPlanById,
  createFloorPlan,
  updateFloorPlan,
  deleteFloorPlan,
  searchCampusAssets,
  duplicateFloorLayout,
  uploadFloorPlanBackground,
  moveAsset,
} from '../controllers/floorPlanController.js';
import { authenticate, requirePermission, authorize } from '../middleware/auth.js';
import { floorPlanImageUpload } from '../middleware/floorPlanUpload.js';

const router = Router();

router.use(authenticate);

// View floor plans & campus-wide asset search
router.get('/', requirePermission('organization:view'), getFloorPlans);
router.get('/assets/search', requirePermission('organization:view'), searchCampusAssets);
router.get('/:id', requirePermission('organization:view'), getFloorPlanById);

// Asset Management
router.post('/assets/move', requirePermission('knowledge:manage'), moveAsset);

// Create / Edit / Duplicate floor plans / Background image upload
router.post('/', requirePermission('knowledge:manage'), createFloorPlan);
router.post('/:id/duplicate-layout', requirePermission('knowledge:manage'), duplicateFloorLayout);
router.post(
  '/:id/background-image',
  requirePermission('knowledge:manage'),
  floorPlanImageUpload('backgroundImage'),
  uploadFloorPlanBackground
);
router.put('/:id', requirePermission('knowledge:manage'), updateFloorPlan);

// Delete floor plan (Super admin / Admin only)
router.delete('/:id', authorize('admin', 'super_admin'), deleteFloorPlan);

export default router;
