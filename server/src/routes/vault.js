import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  getVaultStatus,
  setupPin,
  verifyPin,
  changePin,
  listItems,
  createItem,
  updateItem,
  deleteItem,
  toggleFavorite,
} from '../controllers/vaultController.js';

const router = Router();

// All vault endpoints require user authentication
router.use(authenticate);

// Status & Security configuration
router.get('/status', getVaultStatus);
router.post('/setup-pin', setupPin);
router.post('/verify-pin', verifyPin);
router.post('/change-pin', changePin);

// Vault items CRUD
router.get('/items', listItems);
router.post('/items', createItem);
router.put('/items/:id', updateItem);
router.delete('/items/:id', deleteItem);
router.patch('/items/:id/favorite', toggleFavorite);

export default router;
