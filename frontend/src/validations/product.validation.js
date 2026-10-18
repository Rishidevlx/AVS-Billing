import * as yup from 'yup';

export const productSchema = yup.object().shape({
  name: yup
    .string()
    .trim()
    .required('Product name is required')
    .min(2, 'Product name must be at least 2 characters'),
  category: yup
    .string()
    .trim()
    .required('Category is required'),
  brand: yup
    .string()
    .trim()
    .nullable(),
  hsnCode: yup
    .string()
    .trim()
    .nullable(),
  unit: yup
    .string()
    .trim()
    .required('Unit is required'),
  sellingPrice: yup
    .number()
    .typeError('Selling price must be a valid number')
    .required('Selling price is required')
    .positive('Selling price must be greater than 0'),
  status: yup
    .boolean()
    .default(true),
});

export default productSchema;
