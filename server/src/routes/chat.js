import { Router } from 'express';
import multer from 'multer';
import { authenticate } from '../middleware/auth.js';
import {
  getConversations,
  getOrCreateDirectConversation,
  getMessages,
  sendMessage,
  uploadAttachment,
  markAsRead,
  searchColleagues,
  getOrCreateSupportConversation,
} from '../controllers/chatController.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

const router = Router();

// All chat routes require authentication
router.use(authenticate);

router.get('/conversations', getConversations);
router.post('/conversations', getOrCreateDirectConversation);
router.get('/conversations/:id/messages', getMessages);
router.post('/conversations/:id/messages', sendMessage);
router.post('/upload', upload.single('file'), uploadAttachment);
router.patch('/conversations/:id/read', markAsRead);
router.get('/users', searchColleagues);
router.post('/support/:department', getOrCreateSupportConversation);

export default router;
