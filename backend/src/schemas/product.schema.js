import { z } from 'zod';

export const createProductSchema = z.object({
  name: z
    .string({ required_error: 'Product name is required' })
    .trim()
    .min(2, 'Product name must be at least 2 characters')
    .max(150, 'Product name cannot exceed 150 characters'),
  category: z
    .string({ required_error: 'Category is required' })
    .trim()
    .min(1, 'Category is required'),
  brand: z
    .string()
    .trim()
    .max(100, 'Brand cannot exceed 100 characters')
    .optional()
    .nullable()
    .or(z.literal('')),
  hsnCode: z
    .string()
    .trim()
    .max(50, 'HSN code cannot exceed 50 characters')
    .optional()
    .nullable()
    .or(z.literal('')),
  unit: z.enum(['PCS', 'BOX', 'PACKET', 'PKT', 'TIN'], {
    errorMap: () => ({ message: 'Unit must be PCS, BOX, PACKET, PKT, or TIN' }),
  }),
  sellingPrice: z.coerce
    .number({ required_error: 'Selling price is required' })
    .positive('Selling price must be greater than 0'),
  status: z.boolean().optional().default(true),
});

export const updateProductSchema = createProductSchema;
