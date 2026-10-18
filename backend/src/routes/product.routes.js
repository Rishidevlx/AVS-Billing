import { Router } from 'express';
import * as productController from '../controllers/product.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import {
  createProductSchema,
  updateProductSchema,
} from '../schemas/product.schema.js';

const router = Router();

// GET all products
router.get('/', authenticate, productController.getProducts);

// GET product statistics for KPI cards
router.get('/stats', authenticate, productController.getProductStats);

// GET single product by id
router.get('/:id', authenticate, productController.getProduct);

// POST create product
router.post(
  '/',
  authenticate,
  validate(createProductSchema),
  productController.createProduct
);

// PUT update product
router.put(
  '/:id',
  authenticate,
  validate(updateProductSchema),
  productController.updateProduct
);

// DELETE product
router.delete('/:id', authenticate, productController.deleteProduct);

export default router;
