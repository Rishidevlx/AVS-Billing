import * as yup from 'yup';

// Validation schema for Category Creation & Updation
export const categorySchema = yup.object().shape({
  name: yup
    .string()
    .trim()
    .required('Category name is required')
    .min(2, 'Category name must be at least 2 characters')
    .max(20, 'Category name cannot exceed 20 characters'),
  description: yup
    .string()
    .trim()
    .max(50, 'Description cannot exceed 50 characters')
    .nullable(),
});

export default categorySchema;
