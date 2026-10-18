import { Router } from 'express';
import * as bankController from '../controllers/bank.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();

// Get bank details (authenticated)
router.get('/', authenticate, bankController.getBank);

// Save or update bank details (authenticated)
router.post('/', authenticate, bankController.saveBank);

export default router;
