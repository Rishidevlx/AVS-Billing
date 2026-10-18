import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiPlus, FiTrash2, FiEdit2, FiRefreshCw } from 'react-icons/fi';
import { Button, Table, Badge, Pagination, SearchInput } from '../../components/ui';
import { showToast, showConfirm } from '../../utils/alert';
import ProductKpiCards from './components/ProductKpiCards';

export default function AllProducts() {
  const navigate = useNavigate();

  // Zero dummy data - initialized empty and loaded directly from TiDB backend
  const [products, setProducts] = useState([]);
  const [stats, setStats] = useState({
    totalProducts: 0,
    activeProducts: 0,
    inactiveProducts: 0,
    totalCategories: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Search and Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  // Pagination state (10 items per page)
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const apiBase = import.meta.env.VITE_API_BASE_URL || '';

  // Fetch products from Backend API
  const fetchProductsData = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`${apiBase}/api/v1/products`, {
        credentials: 'include',
      });
      const data = await res.json();

      if (res.ok && data.success) {
        const productList = data.data || [];
        setProducts(productList);

        // Dynamically compute KPI stats
        const total = productList.length;
        const active = productList.filter((p) => p.status).length;
        const inactive = total - active;
        const uniqueCategories = new Set(
          productList.map((p) => p.category).filter(Boolean)
        ).size;

        setStats({
          totalProducts: total,
          activeProducts: active,
          inactiveProducts: inactive,
          totalCategories: uniqueCategories,
        });
      } else {
        showToast(data.message || 'Failed to load products', 'error');
      }
    } catch (err) {
      console.error('Fetch products error:', err);
      showToast('Network error while loading products', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProductsData();
  }, []);

  // Reset pagination to page 1 whenever search or filter criteria changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, selectedStatus]);

  // Navigate to Create Product page in Edit mode
  const handleEdit = (product) => {
    navigate('/inventory/create-product', {
      state: { editProduct: product },
    });
  };

  // Delete product with confirmation
  const handleDelete = async (product) => {
    const result = await showConfirm({
      title: 'Delete Product?',
      text: `Are you sure you want to delete "${product.name}"? This action cannot be undone.`,
      confirmButtonText: 'Yes, Delete',
      cancelButtonText: 'Cancel',
    });

    if (result.isConfirmed) {
      try {
        const res = await fetch(`${apiBase}/api/v1/products/${product.id}`, {
          method: 'DELETE',
          credentials: 'include',
        });
        const data = await res.json();

        if (res.ok && data.success) {
          showToast(data.message || 'Product deleted successfully!', 'success');
          await fetchProductsData();
        } else {
          showToast(data.message || 'Failed to delete product', 'error');
        }
      } catch (err) {
        console.error('Delete product error:', err);
        showToast('Network error while deleting product', 'error');
      }
    }
  };

  // Unique categories for filter dropdown
  const categoryFilterOptions = useMemo(() => {
    const unique = Array.from(
      new Set(products.map((p) => p.category).filter(Boolean))
    );
    return ['ALL', ...unique];
  }, [products]);

  // Filtered products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.category && p.category.toLowerCase().includes(q)) ||
        (p.brand && p.brand.toLowerCase().includes(q)) ||
        (p.hsnCode && String(p.hsnCode).toLowerCase().includes(q));

      const matchesCategory =
        selectedCategory === 'ALL' || p.category === selectedCategory;

      const matchesStatus =
        selectedStatus === 'ALL' ||
        (selectedStatus === 'ACTIVE' && p.status) ||
        (selectedStatus === 'INACTIVE' && !p.status);

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [products, searchQuery, selectedCategory, selectedStatus]);

  // Paginated slice
  const totalPages = Math.ceil(filteredProducts.length / pageSize) || 1;
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredProducts.slice(start, start + pageSize);
  }, [filteredProducts, currentPage, pageSize]);

  // Reusable Table Column Definitions
  const tableColumns = [
    {
      key: 'sno',
      label: 'S.No',
      align: 'center',
      width: 'w-14',
      render: (_, __, index) => (
        <span className="font-bold text-[#646B72]">
          {(currentPage - 1) * pageSize + index + 1}
        </span>
      ),
    },
    {
      key: 'name',
      label: 'Product Name',
      render: (val) => (
        <span className="font-bold text-[#212B36] whitespace-nowrap">{val}</span>
      ),
    },
    {
      key: 'category',
      label: 'Category',
      render: (val) => (
        <span className="font-medium text-[#212B36]">{val || '-'}</span>
      ),
    },
    {
      key: 'brand',
      label: 'Brand',
      render: (val) => (
        <span className="text-[#646B72] font-medium">{val || '-'}</span>
      ),
    },
    {
      key: 'hsnCode',
      label: 'HSN Code',
      render: (val) => (
        <span className="text-[#646B72] font-medium">{val || '-'}</span>
      ),
    },
    {
      key: 'unit',
      label: 'Unit',
      align: 'center',
      width: 'w-24',
      render: (val) => (
        <span className="inline-block px-2 py-0.5 rounded-md text-[11px] font-bold bg-gray-100 text-[#646B72]">
          {val || 'PCS'}
        </span>
      ),
    },
    {
      key: 'sellingPrice',
      label: 'Selling Price',
      align: 'right',
      render: (val) => (
        <span className="font-extrabold text-[#212B36]">
          ₹{Number(val || 0).toFixed(2)}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      align: 'center',
      width: 'w-24',
      render: (val) => (
        <Badge variant="outline" color={val ? 'success' : 'danger'}>
          {val ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      align: 'center',
      width: 'w-24',
      render: (_, row) => (
        <div className="flex items-center justify-center gap-1.5">
          {/* Edit Product Action */}
          <button
            type="button"
            onClick={() => handleEdit(row)}
            title="Edit Product"
            className="p-1.5 rounded-md bg-[#FFF5EC] text-[#FE9F43] hover:bg-[#FE9F43] hover:text-white transition-all cursor-pointer shadow-2xs"
          >
            <FiEdit2 className="text-[13px]" />
          </button>

          {/* Delete Product Action */}
          <button
            type="button"
            onClick={() => handleDelete(row)}
            title="Delete Product"
            className="p-1.5 rounded-md bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all cursor-pointer shadow-2xs"
          >
            <FiTrash2 className="text-[13px]" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-[24px] font-bold text-[#212B36] tracking-tight">
            All Products
          </h1>
          <p className="text-[13.5px] font-medium text-[#646B72] mt-0.5">
            View, search, edit, and manage all inventory stock items.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Refresh Button (White background with proper padding and width) */}
          <button
            type="button"
            onClick={fetchProductsData}
            title="Refresh Products"
            className="w-9.5 h-9.5 bg-white border border-gray-200 text-[#646B72] hover:text-[#212B36] hover:bg-gray-50/80 rounded-lg shadow-xs flex items-center justify-center cursor-pointer transition-all active:scale-95"
          >
            <FiRefreshCw className={`text-[14px] ${isLoading ? 'animate-spin text-[#FE9F43]' : ''}`} />
          </button>

          {/* Add Product Button */}
          <Button
            type="button"
            variant="primary"
            leftIcon={FiPlus}
            onClick={() => navigate('/inventory/create-product')}
            className="px-4 py-2 rounded-lg text-[13px] font-bold shadow-xs"
          >
            Add Product
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <ProductKpiCards stats={stats} />

      {/* Main Table Card */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-xs space-y-4">
        {/* Search & Filter Toolbar */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 pb-3 border-b border-gray-100">
          {/* Global Search Component */}
          <div className="w-full md:w-72">
            <SearchInput
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onClear={() => setSearchQuery('')}
              placeholder="Search product, category, brand..."
            />
          </div>

          {/* Filter Dropdowns (White background) */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Category Filter */}
            <div className="flex items-center gap-1.5 text-[12.5px]">
              <span className="text-[#646B72] font-semibold hidden sm:inline">
                Category:
              </span>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="py-1.5 px-3 bg-white border border-gray-200 rounded-lg text-[12.5px] font-medium text-[#212B36] outline-none cursor-pointer focus:border-[#FE9F43] focus:ring-2 focus:ring-[#FE9F43]/15 shadow-xs transition-all"
              >
                {categoryFilterOptions.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat === 'ALL' ? 'All Categories' : cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1.5 text-[12.5px]">
              <span className="text-[#646B72] font-semibold hidden sm:inline">
                Status:
              </span>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="py-1.5 px-3 bg-white border border-gray-200 rounded-lg text-[12.5px] font-medium text-[#212B36] outline-none cursor-pointer focus:border-[#FE9F43] focus:ring-2 focus:ring-[#FE9F43]/15 shadow-xs transition-all"
              >
                <option value="ALL">All Status</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        {/* Products Table */}
        {isLoading ? (
          <div className="py-16 flex flex-col items-center justify-center text-[#646B72]">
            <div className="w-6 h-6 border-2 border-[#FE9F43] border-t-transparent rounded-full animate-spin mb-2"></div>
            <p className="text-[13px] font-medium">Loading products...</p>
          </div>
        ) : (
          <Table
            columns={tableColumns}
            data={paginatedProducts}
            emptyText="No products found. Click 'Add Product' to create one."
          />
        )}

        {/* Global Dreams POS Boxed Pagination - Always shown by default */}
        {!isLoading && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredProducts.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
          />
        )}
      </div>
    </div>
  );
}
