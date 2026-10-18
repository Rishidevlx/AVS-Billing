import * as productService from '../services/product.service.js';

export const getProducts = async (req, res, next) => {
  try {
    const products = await productService.fetchProducts();
    res.status(200).json({
      success: true,
      data: products,
    });
  } catch (err) {
    next(err);
  }
};

export const getProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const product = await productService.fetchProductById(id);
    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (err) {
    next(err);
  }
};

export const getProductStats = async (req, res, next) => {
  try {
    const stats = await productService.fetchProductStats();
    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (err) {
    next(err);
  }
};

export const createProduct = async (req, res, next) => {
  try {
    const product = await productService.addProduct(req.body);
    res.status(201).json({
      success: true,
      message: 'Product created successfully!',
      data: product,
    });
  } catch (err) {
    next(err);
  }
};

export const updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const product = await productService.editProduct(id, req.body);
    res.status(200).json({
      success: true,
      message: 'Product updated successfully!',
      data: product,
    });
  } catch (err) {
    next(err);
  }
};

export const deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    await productService.removeProduct(id);
    res.status(200).json({
      success: true,
      message: 'Product deleted successfully!',
    });
  } catch (err) {
    next(err);
  }
};
