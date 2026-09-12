import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  getConversations,
  getOrCreateDirectConversation,
  getMessages,
  sendMessage,
  markAsRead,
  searchColleagues,
  getOrCreateSupportConversation,
} from '../controllers/chatController.js';

const router = Router();

// All chat routes require authentication
router.use(authenticate);

router.get('/conversations', getConversations);
router.post('/conversations', getOrCreateDirectConversation);
router.get('/conversations/:id/messages', getMessages);
router.post('/conversations/:id/messages', sendMessage);
router.patch('/conversations/:id/read', markAsRead);
router.get('/users', searchColleagues);
router.post('/support/:department', getOrCreateSupportConversation);

export default router;
