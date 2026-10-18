import { z } from 'zod';

export const createCategorySchema = z.object({
  name: z
    .string({ required_error: 'Category name is required' })
    .trim()
    .min(2, 'Category name must be at least 2 characters')
    .max(20, 'Category name cannot exceed 20 characters'),
  description: z
    .string()
    .trim()
    .max(50, 'Description cannot exceed 50 characters')
    .optional()
    .nullable()
    .or(z.literal('')),
});

export const updateCategorySchema = z.object({
  name: z
    .string({ required_error: 'Category name is required' })
    .trim()
    .min(2, 'Category name must be at least 2 characters')
    .max(20, 'Category name cannot exceed 20 characters'),
  description: z
    .string()
    .trim()
    .max(50, 'Description cannot exceed 50 characters')
    .optional()
    .nullable()
    .or(z.literal('')),
});
