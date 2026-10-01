import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  listResources,
  createResource,
  updateResource,
  deleteResource,
  listBookings,
  checkAvailability,
  createBooking,
  cancelBooking,
  getBookingStats,
} from '../controllers/bookingController.js';

const router = Router();

// All booking routes require authentication
router.use(authenticate);

// Resources endpoints
router.get('/resources', listResources);
router.post('/resources', createResource);
router.patch('/resources/:id', updateResource);
router.delete('/resources/:id', deleteResource);

// Availability & Stats
router.get('/check-availability', checkAvailability);
router.get('/stats', getBookingStats);

// Bookings endpoints
router.get('/', listBookings);
router.post('/', createBooking);
router.patch('/:id/cancel', cancelBooking);

export default router;
