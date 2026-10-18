import { Router } from 'express';
import * as numberingController from '../controllers/numbering.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();

// Get numbering settings (authenticated)
router.get('/', authenticate, numberingController.getNumbering);

// Save or update numbering settings (authenticated)
router.post('/', authenticate, numberingController.saveNumbering);

// Reset sequence to 1 (authenticated)
router.post('/reset', authenticate, numberingController.resetSequence);

export default router;
