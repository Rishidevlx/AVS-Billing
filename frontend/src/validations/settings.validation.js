import * as yup from 'yup';

// Validation schema for Company Details (System Settings Tab 1)
export const companyDetailsSchema = yup.object().shape({
  companyName: yup
    .string()
    .trim()
    .required('Company name is required'),
  gstin: yup
    .string()
    .trim()
    .notRequired(),
  mobile: yup
    .string()
    .trim()
    .required('Mobile number is required')
    .matches(/^[6-9]\d{9}$/, 'Please enter a valid 10-digit mobile number'),
  email: yup
    .string()
    .trim()
    .required('Email address is required')
    .email('Please enter a valid email address'),
  address: yup
    .string()
    .trim()
    .required('Company address is required'),
  logo: yup
    .string()
    .required('Company logo is required'),
  signature: yup
    .string()
    .required('Authorized digital signature is required'),
});

// Validation schema for Bank Account (System Settings Tab 2)
export const bankAccountSchema = yup.object().shape({
  bankName: yup
    .string()
    .trim()
    .required('Bank name is required'),
  accountName: yup
    .string()
    .trim()
    .required('Account holder name is required'),
  accountNumber: yup
    .string()
    .trim()
    .required('Account number is required')
    .matches(/^\d{9,18}$/, 'Account number must be 9 to 18 digits'),
  ifscCode: yup
    .string()
    .trim()
    .required('IFSC code is required')
    .matches(/^[A-Z]{4}0[A-Z0-9]{6}$/, 'Enter a valid 11-character IFSC code (e.g. SBIN0001234)'),
  branchLocation: yup
    .string()
    .trim()
    .required('Branch location is required'),
});

// Validation schema for Invoice Numbering (System Settings Tab 3)
export const numberingSchema = yup.object().shape({
  invoicePrefix: yup
    .string()
    .trim()
    .required('Receipt prefix is required')
    .matches(/^[A-Za-z0-9\-_/]+$/, 'Prefix can only contain letters, numbers, hyphens, and slashes')
    .max(5, 'Prefix cannot exceed 5 characters'),
});

export default {
  companyDetailsSchema,
  bankAccountSchema,
  numberingSchema,
};

