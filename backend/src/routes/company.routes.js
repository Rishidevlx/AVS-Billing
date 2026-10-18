import { Router } from 'express';
import * as companyController from '../controllers/company.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();

// Get company details (authenticated)
router.get('/', authenticate, companyController.getCompany);

// Save or update company details (authenticated)
router.post('/', authenticate, companyController.saveCompany);

export default router;
