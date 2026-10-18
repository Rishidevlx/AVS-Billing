import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FiCheck, FiRotateCcw, FiArrowLeft } from 'react-icons/fi';
import { Input, Select, Toggle, Button } from '../../components/ui';
import { showToast } from '../../utils/alert';
import { productSchema } from '../../validations/product.validation';

// Standard unit options: PCS, BOX, PACKET
const UNIT_OPTIONS = [
  { value: 'PCS', label: 'PCS (Pieces)' },
  { value: 'BOX', label: 'BOX (Boxes)' },
  { value: 'PACKET', label: 'PACKET (Packets)' },
];

export default function CreateProduct() {
  const navigate = useNavigate();
  const location = useLocation();

  // If navigating from All Products "Edit" button
  const editingProduct = location.state?.editProduct || null;
  const isEditing = Boolean(editingProduct?.id);

  // Dynamic category options loaded from Category API
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);

  // Form state pre-populated if in edit mode
  const [formData, setFormData] = useState({
    name: editingProduct?.name || '',
    category: editingProduct?.category || '',
    brand: editingProduct?.brand || '',
    hsnCode: editingProduct?.hsnCode || '',
    unit: editingProduct?.unit || '',
    sellingPrice:
      editingProduct?.sellingPrice !== undefined
        ? String(editingProduct.sellingPrice)
        : '',
    status:
      editingProduct?.status !== undefined
        ? Boolean(editingProduct.status)
        : true,
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const apiBase = import.meta.env.VITE_API_BASE_URL || '';

  // Fetch available categories from Backend API
  useEffect(() => {
    const loadCategories = async () => {
      setIsLoadingCategories(true);
      try {
        const res = await fetch(`${apiBase}/api/v1/categories`, {
          credentials: 'include',
        });
        if (res.ok) {
          const result = await res.json();
          if (result.data && result.data.length > 0) {
            setCategoryOptions(
              result.data.map((cat) => ({
                value: cat.name,
                label: cat.name,
              }))
            );
            return;
          }
        }
      } catch (err) {
        console.warn('Backend categories fetch failed:', err);
      } finally {
        setIsLoadingCategories(false);
      }
    };

    loadCategories();
  }, [apiBase]);

  // Handle text/select changes
  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  // Reset form
  const handleReset = () => {
    if (isEditing) {
      setFormData({
        name: editingProduct.name || '',
        category: editingProduct.category || '',
        brand: editingProduct.brand || '',
        hsnCode: editingProduct.hsnCode || '',
        unit: editingProduct.unit || '',
        sellingPrice: String(editingProduct.sellingPrice || ''),
        status: Boolean(editingProduct.status),
      });
    } else {
      setFormData({
        name: '',
        category: '',
        brand: '',
        hsnCode: '',
        unit: '',
        sellingPrice: '',
        status: true,
      });
    }
    setErrors({});
  };

  // Form Submit Handler (Create or Update in Backend API)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    try {
      // 1. Client-side Yup validation
      await productSchema.validate(formData, { abortEarly: false });

      const url = isEditing
        ? `${apiBase}/api/v1/products/${editingProduct.id}`
        : `${apiBase}/api/v1/products`;

      const method = isEditing ? 'PUT' : 'POST';

      // 2. Call Backend API
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          name: formData.name.trim(),
          category: formData.category.trim(),
          brand: formData.brand.trim() || null,
          hsnCode: formData.hsnCode.trim() || null,
          unit: formData.unit,
          sellingPrice: Number(formData.sellingPrice),
          status: Boolean(formData.status),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to save product');
      }

      // Success notification
      showToast(
        data.message || (isEditing ? 'Product updated successfully!' : 'Product created successfully!'),
        'success'
      );

      // Navigate directly to All Products list
      setTimeout(() => {
        navigate('/inventory/products');
      }, 400);
    } catch (err) {
      if (err.inner) {
        const validationErrors = {};
        err.inner.forEach((error) => {
          validationErrors[error.path] = error.message;
        });
        setErrors(validationErrors);
        showToast('Please fill all required fields', 'warning');
      } else {
        showToast(err.message || 'Failed to save product', 'error');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Page Heading & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-[24px] font-bold text-[#212B36] tracking-tight">
            {isEditing ? 'Edit Product' : 'Create Product'}
          </h1>
          <p className="text-[13.5px] font-medium text-[#646B72] mt-0.5">
            {isEditing
              ? 'Update existing product information, pricing, and stock status.'
              : 'Add new inventory items, stock, and billing products.'}
          </p>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          leftIcon={FiArrowLeft}
          onClick={() => navigate('/inventory/products')}
          className="border border-gray-200 text-[#646B72] hover:text-[#212B36] self-start sm:self-auto rounded-lg px-3 py-1.5"
        >
          View All Products
        </Button>
      </div>

      {/* Main Product Form Card */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-xs">
        {/* Card Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <h2 className="text-[15px] font-bold text-[#212B36]">
            {isEditing ? 'Update Product Details' : 'Product Information'}
          </h2>
          {isEditing && (
            <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-[#FFF5EC] text-[#FE9F43] border border-[#FFE7D3]">
              Editing #{editingProduct.id}
            </span>
          )}
        </div>

        {/* Product Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-5">
          {/* Responsive 2-Column Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4.5">
            {/* 1. Product Name (Required) */}
            <div className="md:col-span-2">
              <Input
                id="productName"
                name="name"
                label="Product Name"
                required
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Enter product name"
                error={errors.name}
              />
            </div>

            {/* 2. Category (Required Dropdown) */}
            <div>
              <Select
                id="productCategory"
                name="category"
                label="Category"
                required
                value={formData.category}
                onChange={(e) => handleChange('category', e.target.value)}
                options={categoryOptions}
                placeholder={
                  isLoadingCategories ? 'Loading categories...' : 'Select Category'
                }
                error={errors.category}
              />
            </div>

            {/* 3. Brand (Optional) */}
            <div>
              <Input
                id="productBrand"
                name="brand"
                label="Brand"
                value={formData.brand}
                onChange={(e) => handleChange('brand', e.target.value)}
                placeholder="Enter brand name"
                error={errors.brand}
              />
            </div>

            {/* 4. HSN Code (Optional) */}
            <div>
              <Input
                id="productHsn"
                name="hsnCode"
                label="HSN Code"
                value={formData.hsnCode}
                onChange={(e) => handleChange('hsnCode', e.target.value)}
                placeholder="Enter HSN code"
                error={errors.hsnCode}
              />
            </div>

            {/* 5. Unit (Required Dropdown: PCS, BOX, PACKET) */}
            <div>
              <Select
                id="productUnit"
                name="unit"
                label="Unit"
                required
                value={formData.unit}
                onChange={(e) => handleChange('unit', e.target.value)}
                options={UNIT_OPTIONS}
                placeholder="Select Unit"
                error={errors.unit}
              />
            </div>

            {/* 6. Selling Price (Required) */}
            <div>
              <Input
                id="productPrice"
                name="sellingPrice"
                type="number"
                step="0.01"
                min="0"
                label="Selling Price"
                required
                value={formData.sellingPrice}
                onChange={(e) => handleChange('sellingPrice', e.target.value)}
                placeholder="0.00"
                leftIcon={<span className="font-bold text-[#FE9F43] text-[15px]">₹</span>}
                error={errors.sellingPrice}
              />
            </div>

            {/* 7. Status (Toggle: Active / Inactive) */}
            <div className="flex items-center">
              <div className="w-full bg-[#F8FAFC] border border-gray-100 rounded-lg p-3.5">
                <Toggle
                  id="productStatus"
                  name="status"
                  label="Product Status"
                  description="Inactive products will be hidden from invoice billing."
                  checked={formData.status}
                  onChange={(val) => handleChange('status', val)}
                  activeLabel="Active"
                  inactiveLabel="Inactive"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <Button
              type="button"
              variant="ghost"
              onClick={handleReset}
              leftIcon={FiRotateCcw}
              className="border border-gray-200 text-[#646B72] hover:text-[#212B36] px-4 py-2 rounded-lg text-[13px]"
            >
              {isEditing ? 'Reset to Original' : 'Reset Form'}
            </Button>

            <Button
              type="submit"
              variant="primary"
              loading={isSubmitting}
              leftIcon={FiCheck}
              className="px-6 py-2 rounded-lg text-[13.5px] font-bold"
            >
              {isEditing ? 'Update Product' : 'Save Product'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
