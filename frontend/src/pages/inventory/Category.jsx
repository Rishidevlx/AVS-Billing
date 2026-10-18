import React, { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiRotateCcw, FiCheck } from 'react-icons/fi';
import { Input, Button, Table } from '../../components/ui';
import { showToast, showConfirm } from '../../utils/alert';
import { categorySchema } from '../../validations/category.validation';

export default function Category() {
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form input state
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [errors, setErrors] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const apiBase = import.meta.env.VITE_API_BASE_URL || '';

  // Fetch all categories from backend API
  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`${apiBase}/api/v1/categories`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setCategories(data.data || []);
      } else {
        showToast(data.message || 'Failed to load categories', 'error');
      }
    } catch (err) {
      console.error('Fetch categories error:', err);
      showToast('Network error while loading categories', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Input change handler
  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  // Reset form
  const handleClear = () => {
    setFormData({ name: '', description: '' });
    setErrors({});
    setEditingId(null);
  };

  // Form Submit (Create / Update in Backend API)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    try {
      // 1. Client-side Yup validation
      await categorySchema.validate(formData, { abortEarly: false });

      const url = editingId
        ? `${apiBase}/api/v1/categories/${editingId}`
        : `${apiBase}/api/v1/categories`;

      const method = editingId ? 'PUT' : 'POST';

      // 2. Call Backend API
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description.trim(),
        }),
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        throw new Error(result.message || 'Failed to save category');
      }

      showToast(result.message || 'Category saved successfully!', 'success');
      handleClear();
      await fetchCategories();
    } catch (err) {
      if (err.inner) {
        const validationErrors = {};
        err.inner.forEach((error) => {
          validationErrors[error.path] = error.message;
        });
        setErrors(validationErrors);
      } else {
        showToast(err.message || 'Operation failed', 'error');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Edit action
  const handleEdit = (category) => {
    setEditingId(category.id);
    setFormData({
      name: category.name || '',
      description: category.description || '',
    });
    setErrors({});
  };

  // Delete action with SweetAlert confirmation & Backend API call
  const handleDelete = async (category) => {
    const result = await showConfirm({
      title: 'Delete Category?',
      text: `Are you sure you want to delete "${category.name}"? This action cannot be undone.`,
      confirmButtonText: 'Yes, Delete',
      cancelButtonText: 'Cancel',
    });

    if (result.isConfirmed) {
      try {
        const res = await fetch(`${apiBase}/api/v1/categories/${category.id}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        });
        const data = await res.json();

        if (res.ok && data.success) {
          showToast(data.message || 'Category deleted successfully!', 'success');
          if (editingId === category.id) handleClear();
          await fetchCategories();
        } else {
          showToast(data.message || 'Failed to delete category', 'error');
        }
      } catch (err) {
        console.error('Delete error:', err);
        showToast('Network error while deleting category', 'error');
      }
    }
  };

  // Search filter
  const filteredCategories = categories.filter((cat) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      (cat.name && cat.name.toLowerCase().includes(q)) ||
      (cat.description && cat.description.toLowerCase().includes(q))
    );
  });

  // Reusable Table columns definition
  const tableColumns = [
    {
      key: 'sno',
      label: 'S.No',
      align: 'center',
      width: 'w-16',
      render: (_, __, index) => <span className="font-bold text-[#646B72]">{index + 1}</span>,
    },
    {
      key: 'createdAt',
      label: 'DOC',
      width: 'w-36',
      render: (val) => <span className="text-[#646B72] font-medium whitespace-nowrap">{val || '-'}</span>,
    },
    {
      key: 'name',
      label: 'Category Name',
      render: (val) => <span className="font-bold text-[#212B36]">{val}</span>,
    },
    {
      key: 'description',
      label: 'Description',
      render: (val) => <span className="text-[#646B72] line-clamp-2">{val || '-'}</span>,
    },
    {
      key: 'actions',
      label: 'Actions',
      align: 'center',
      width: 'w-24',
      render: (_, row) => {
        const isEditingThis = editingId === row.id;
        return (
          <div className="flex items-center justify-center gap-1.5">
            <button
              type="button"
              onClick={() => handleEdit(row)}
              title="Edit"
              className={`p-1.5 rounded-md transition-all cursor-pointer ${
                isEditingThis
                  ? 'bg-[#FE9F43] text-white'
                  : 'bg-[#FFF5EC] text-[#FE9F43] hover:bg-[#FE9F43] hover:text-white'
              }`}
            >
              <FiEdit2 className="text-[13px]" />
            </button>
            <button
              type="button"
              onClick={() => handleDelete(row)}
              title="Delete"
              className="p-1.5 rounded-md bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all cursor-pointer"
            >
              <FiTrash2 className="text-[13px]" />
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Heading */}
      <div>
        <h1 className="text-[24px] font-bold text-[#212B36] tracking-tight">Categories</h1>
        <p className="text-[13.5px] font-medium text-[#646B72] mt-0.5">
          Manage product categories and classifications for your inventory.
        </p>
      </div>

      {/* 2-Column Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ===== LEFT: CATEGORY FORM ===== */}
        <div className="lg:col-span-5 xl:col-span-4 bg-white rounded-xl border border-gray-100 p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3.5 border-b border-gray-100">
            <h2 className="text-[15px] font-bold text-[#212B36]">Category Information</h2>
            {editingId && (
              <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-[#FFF5EC] text-[#FE9F43] border border-[#FFE7D3]">
                Editing
              </span>
            )}
          </div>

          <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
            {/* Category Name */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label htmlFor="categoryName" className="text-[12.5px] font-semibold text-[#212B36]">
                  Category Name <span className="text-red-500">*</span>
                </label>
                <span className={`text-[11px] font-medium ${formData.name.length > 20 ? 'text-red-500 font-bold' : 'text-[#646B72]'}`}>
                  {formData.name.length}/20
                </span>
              </div>
              <Input
                id="categoryName"
                name="name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Enter category name"
                maxLength={20}
                error={errors.name}
              />
            </div>

            {/* Description */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label htmlFor="categoryDesc" className="text-[12.5px] font-semibold text-[#212B36]">
                  Description
                </label>
                <span className={`text-[11px] font-medium ${formData.description.length > 50 ? 'text-red-500 font-bold' : 'text-[#646B72]'}`}>
                  {formData.description.length}/50
                </span>
              </div>
              <textarea
                id="categoryDesc"
                name="description"
                rows="3"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Enter description (optional)"
                maxLength={50}
                className={`w-full py-2 px-3 bg-[#F7F7F7] border rounded-lg text-[13.5px] font-medium text-[#212B36] placeholder-[#646B72]/60 transition-all outline-none resize-none
                  ${errors.description ? 'border-red-400 focus:border-red-500' : 'border-gray-100 hover:border-gray-200 focus:border-[#FE9F43] focus:bg-white focus:ring-3 focus:ring-[#FE9F43]/15'}
                `}
              />
              {errors.description && (
                <p className="text-[11.5px] font-medium text-red-500">{errors.description}</p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={handleClear}
                leftIcon={FiRotateCcw}
                className="border border-gray-200 text-[#646B72] px-3.5 py-2 rounded-lg text-[13px]"
              >
                {editingId ? 'Cancel' : 'Clear'}
              </Button>
              <Button
                type="submit"
                variant="primary"
                loading={isSubmitting}
                leftIcon={editingId ? FiCheck : FiPlus}
                className="px-5 py-2 rounded-lg text-[13px]"
              >
                {editingId ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </div>

        {/* ===== RIGHT: REUSABLE TABLE ===== */}
        <div className="lg:col-span-7 xl:col-span-8 bg-white rounded-xl border border-gray-100 p-5 shadow-xs space-y-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-gray-100">
            <h2 className="text-[15px] font-bold text-[#212B36]">Category List</h2>

            {/* Quick Search */}
            <div className="relative w-full sm:w-56">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#646B72]">
                <FiSearch className="text-[13px]" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search category..."
                className="w-full pl-8 pr-3 py-1.5 bg-[#F7F7F7] border border-gray-100 rounded-lg text-[12.5px] font-medium text-[#212B36] placeholder-[#646B72]/60 focus:bg-white focus:border-[#FE9F43] focus:ring-2 focus:ring-[#FE9F43]/15 outline-none transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-[12px] text-[#646B72] hover:text-[#212B36]"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Reusable Componentized Table with live backend data */}
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center text-[#646B72]">
              <div className="w-6 h-6 border-2 border-[#FE9F43] border-t-transparent rounded-full animate-spin mb-2"></div>
              <p className="text-[13px] font-medium">Loading categories...</p>
            </div>
          ) : (
            <Table
              columns={tableColumns}
              data={filteredCategories}
              selectedId={editingId}
              emptyText="No categories found."
            />
          )}
        </div>
      </div>
    </div>
  );
}
