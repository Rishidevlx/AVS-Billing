import { Router } from 'express';
import * as categoryController from '../controllers/category.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import {
  createCategorySchema,
  updateCategorySchema,
} from '../schemas/category.schema.js';

const router = Router();

// GET all categories
router.get('/', authenticate, categoryController.getCategories);

// POST create category
router.post(
  '/',
  authenticate,
  validate(createCategorySchema),
  categoryController.createCategory
);

// PUT update category
router.put(
  '/:id',
  authenticate,
  validate(updateCategorySchema),
  categoryController.updateCategory
);

// DELETE category
router.delete('/:id', authenticate, categoryController.deleteCategory);

export default router;
