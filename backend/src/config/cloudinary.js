import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

/**
 * Upload an image to Cloudinary in the 'AVS' folder with automatic compression
 * @param {string} fileInput - Base64 Data URI or image URL
 * @param {string} folder - Destination folder in Cloudinary (default: 'AVS')
 * @returns {Promise<string>} - Cloudinary secure URL
 */
export const uploadImage = async (fileInput, folder = 'AVS') => {
  if (!fileInput) return '';

  // If already an existing Cloudinary / HTTP URL, no need to re-upload
  if (fileInput.startsWith('http://') || fileInput.startsWith('https://')) {
    return fileInput;
  }

  // Validate approximate base64 image size (max 3MB)
  if (fileInput.startsWith('data:image')) {
    const stringLength = fileInput.length - 'data:image/png;base64,'.length;
    const sizeInBytes = 4 * Math.ceil(stringLength / 3) * 0.5624896334383687;
    const maxBytes = 3 * 1024 * 1024; // 3MB

    if (sizeInBytes > maxBytes) {
      const error = new Error('Image size exceeds maximum allowed limit of 3MB');
      error.statusCode = 400;
      throw error;
    }
  }

  // Upload to Cloudinary with compression & optimization
  const uploadResult = await cloudinary.uploader.upload(fileInput, {
    folder,
    resource_type: 'image',
    transformation: [
      { quality: 'auto' },
      { fetch_format: 'auto' },
    ],
  });

  return uploadResult.secure_url;
};

/**
 * Upload generated receipt PDF or document image to Cloudinary
 * @param {string} fileInput - Base64 Data URI (PDF or image)
 * @param {string} filename - Identifier for public_id
 * @param {string} folder - Destination folder (default: 'AVS/receipts')
 * @returns {Promise<string>} - Cloudinary secure URL
 */
export const uploadPdf = async (fileInput, filename = 'receipt', folder = 'AVS/receipts') => {
  if (!fileInput) return '';

  if (fileInput.startsWith('http://') || fileInput.startsWith('https://')) {
    return fileInput;
  }

  const cleanFilename = String(filename).replace(/[^a-zA-Z0-9-_]/g, '_');
  const timestamp = Date.now();
  const isPdf = fileInput.startsWith('data:application/pdf');

  const uploadResult = await cloudinary.uploader.upload(fileInput, {
    folder,
    resource_type: isPdf ? 'raw' : 'image',
    public_id: isPdf ? `${cleanFilename}_${timestamp}.pdf` : `${cleanFilename}_${timestamp}`,
    access_mode: 'public',
  });

  return uploadResult.secure_url;
};


export default cloudinary;

