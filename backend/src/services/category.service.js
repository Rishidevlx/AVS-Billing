import * as categoryRepo from '../repositories/category.repository.js';

export const fetchCategories = async () => {
  return await categoryRepo.getAllCategories();
};

export const addCategory = async ({ name, description }) => {
  const existing = await categoryRepo.getCategoryByName(name);
  if (existing) {
    const error = new Error('Category name already exists');
    error.statusCode = 400;
    throw error;
  }

  return await categoryRepo.createCategory({ name, description });
};

export const editCategory = async (id, { name, description }) => {
  const existingCategory = await categoryRepo.getCategoryById(id);
  if (!existingCategory) {
    const error = new Error('Category not found');
    error.statusCode = 404;
    throw error;
  }

  const duplicateName = await categoryRepo.getCategoryByName(name, id);
  if (duplicateName) {
    const error = new Error('Another category with this name already exists');
    error.statusCode = 400;
    throw error;
  }

  return await categoryRepo.updateCategory(id, { name, description });
};

export const removeCategory = async (id) => {
  const existingCategory = await categoryRepo.getCategoryById(id);
  if (!existingCategory) {
    const error = new Error('Category not found');
    error.statusCode = 404;
    throw error;
  }

  return await categoryRepo.deleteCategory(id);
};
