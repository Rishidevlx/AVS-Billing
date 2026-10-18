import * as companyRepository from '../repositories/company.repository.js';
import { uploadImage } from '../config/cloudinary.js';

export const fetchCompany = async () => {
  const row = await companyRepository.getCompanyDetails();
  if (!row) return null;

  return {
    id: row.id,
    companyName: row.company_name,
    gstin: row.gstin || '',
    mobile: row.mobile,
    email: row.email,
    address: row.address,
    logo: row.logo_url,
    signature: row.signature_url,
    updatedAt: row.updated_at,
  };
};

export const saveCompany = async (data) => {
  const { companyName, gstin, mobile, email, address, logo, signature } = data;

  // 1. Upload Logo to Cloudinary (AVS folder) with compression
  let logoUrl = logo;
  if (logo && logo.startsWith('data:image')) {
    logoUrl = await uploadImage(logo, 'AVS');
  }

  // 2. Upload Digital Signature to Cloudinary (AVS folder) with compression
  let signatureUrl = signature;
  if (signature && signature.startsWith('data:image')) {
    signatureUrl = await uploadImage(signature, 'AVS');
  }

  // 3. Save details with Cloudinary URLs in TiDB Cloud
  const saved = await companyRepository.upsertCompanyDetails({
    companyName,
    gstin,
    mobile,
    email,
    address,
    logoUrl,
    signatureUrl,
  });

  return {
    companyName: saved.companyName,
    gstin: saved.gstin || '',
    mobile: saved.mobile,
    email: saved.email,
    address: saved.address,
    logo: saved.logoUrl,
    signature: saved.signatureUrl,
  };
};
