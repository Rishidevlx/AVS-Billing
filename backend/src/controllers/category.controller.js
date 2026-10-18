import * as categoryService from '../services/category.service.js';

export const getCategories = async (req, res, next) => {
  try {
    const categories = await categoryService.fetchCategories();
    res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (err) {
    next(err);
  }
};

export const createCategory = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    const category = await categoryService.addCategory({ name, description });
    res.status(201).json({
      success: true,
      message: 'Category created successfully!',
      data: category,
    });
  } catch (err) {
    next(err);
  }
};

export const updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    const category = await categoryService.editCategory(id, { name, description });
    res.status(200).json({
      success: true,
      message: 'Category updated successfully!',
      data: category,
    });
  } catch (err) {
    next(err);
  }
};

export const deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    await categoryService.removeCategory(id);
    res.status(200).json({
      success: true,
      message: 'Category deleted successfully!',
    });
  } catch (err) {
    next(err);
  }
};
