import { Router } from 'express';
import {
  listAnnouncementCategories,
  listAnnouncements,
  getAnnouncement,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
} from '../controllers/announcementController.js';
import {
  createAnnouncementValidator,
  updateAnnouncementValidator,
  announcementIdValidator,
  listAnnouncementValidator,
} from '../validators/announcementValidators.js';
import validate from '../middleware/validate.js';
import { authenticate, requirePermission } from '../middleware/auth.js';
import { imageUpload } from '../middleware/imageUpload.js';

const router = Router();
router.use(authenticate);
router.get('/categories', requirePermission('announcements:view'), listAnnouncementCategories);
router.get('/', requirePermission('announcements:view'), listAnnouncementValidator, validate, listAnnouncements);
router.get('/:id', requirePermission('announcements:view'), announcementIdValidator, validate, getAnnouncement);
router.post('/', requirePermission('announcements:manage'), imageUpload('coverImage'), createAnnouncementValidator, validate, createAnnouncement);
router.patch('/:id', requirePermission('announcements:manage'), imageUpload('coverImage'), updateAnnouncementValidator, validate, updateAnnouncement);
router.delete('/:id', requirePermission('announcements:manage'), announcementIdValidator, validate, deleteAnnouncement);

export default router;
