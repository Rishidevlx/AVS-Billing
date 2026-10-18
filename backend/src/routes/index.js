import { Router } from 'express';
import authRoutes from './auth.routes.js';
import companyRoutes from './company.routes.js';
import bankRoutes from './bank.routes.js';
import numberingRoutes from './numbering.routes.js';
import categoryRoutes from './category.routes.js';
import productRoutes from './product.routes.js';
import invoiceRoutes from './invoice.routes.js';
import dashboardRoutes from './dashboard.routes.js';
import { pingTiDB } from '../config/db.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/company', companyRoutes);
router.use('/bank', bankRoutes);
router.use('/numbering', numberingRoutes);
router.use('/categories', categoryRoutes);
router.use('/products', productRoutes);
router.use('/invoices', invoiceRoutes);
router.use('/dashboard', dashboardRoutes);

// Health check endpoint (also wakes and tests TiDB Cloud connection)
router.get('/health', async (req, res) => {
  const isDbAlive = await pingTiDB();
  res.status(200).json({
    status: 'ok',
    service: 'rinvox-billing-api',
    database: isDbAlive ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  });
});

export default router;
