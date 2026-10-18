import * as productRepo from '../repositories/product.repository.js';

export const fetchProducts = async () => {
  return await productRepo.getAllProducts();
};

export const fetchProductById = async (id) => {
  const product = await productRepo.getProductById(id);
  if (!product) {
    const error = new Error('Product not found');
    error.statusCode = 404;
    throw error;
  }
  return product;
};

export const fetchProductStats = async () => {
  return await productRepo.getProductStats();
};

export const addProduct = async (data) => {
  return await productRepo.createProduct(data);
};

export const editProduct = async (id, data) => {
  const existing = await productRepo.getProductById(id);
  if (!existing) {
    const error = new Error('Product not found');
    error.statusCode = 404;
    throw error;
  }
  return await productRepo.updateProduct(id, data);
};

export const removeProduct = async (id) => {
  const existing = await productRepo.getProductById(id);
  if (!existing) {
    const error = new Error('Product not found');
    error.statusCode = 404;
    throw error;
  }
  return await productRepo.deleteProduct(id);
};
