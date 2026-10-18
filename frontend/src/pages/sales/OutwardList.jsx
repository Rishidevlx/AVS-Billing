import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiPlus,
  FiTrash2,
  FiEdit2,
  FiRefreshCw,
  FiCalendar,
  FiDownload,
  FiX,
} from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import * as XLSX from 'xlsx';
import { Button, Table, Pagination, SearchInput, Checkbox } from '../../components/ui';
import { showToast, showConfirm } from '../../utils/alert';
import OutwardKpiCards from './components/OutwardKpiCards';

export default function OutwardList() {
  const navigate = useNavigate();
  const apiBase = import.meta.env.VITE_API_BASE_URL || '';

  const [invoices, setInvoices] = useState([]);
  const [stats, setStats] = useState({
    totalInvoices: 0,
    totalSales: 0,
    totalQtySold: 0,
    avgBillValue: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Search & Range Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Selected row checkboxes for Excel Export
  const [selectedIds, setSelectedIds] = useState([]);

  // Pagination (10 per page)
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Company Name from System Settings for WhatsApp
  const [companyName, setCompanyName] = useState(() => {
    return localStorage.getItem('company_name') || 'AVS Crackers';
  });

  // Fetch company details for dynamic WhatsApp company name
  useEffect(() => {
    const fetchCompany = async () => {
      try {
        const res = await fetch(`${apiBase}/api/v1/company`, {
          credentials: 'include',
        });
        if (res.ok) {
          const result = await res.json();
          if (result.data?.companyName) {
            setCompanyName(result.data.companyName);
            localStorage.setItem('company_name', result.data.companyName);
          }
        }
      } catch (err) {
        console.warn('Notice loading company details for Outward:', err);
      }
    };

    fetchCompany();
  }, [apiBase]);

  // Fetch invoices from backend (fallback to localStorage if needed)
  const fetchInvoices = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${apiBase}/api/v1/invoices`, {
        credentials: 'include',
      });
      const data = await res.json();

      let list = [];

      if (res.ok && data.success && Array.isArray(data.data) && data.data.length > 0) {
        list = data.data;
      } else {
        // Fallback to localStorage bills
        const localBills = JSON.parse(
          localStorage.getItem('rinvox_outward_bills') || '[]'
        );
        list = localBills.map((b, idx) => ({
          id: b.id || idx + 1,
          invoiceNumber: b.invoiceNumber,
          invoiceDate: b.invoiceDate,
          customerName: b.customer?.name || b.customerName,
          customerMobile: b.customer?.mobile || b.customerMobile,
          billingAddress: b.customer?.billingAddress || b.billingAddress,
          deliveryAddress: b.customer?.deliveryAddress || b.deliveryAddress,
          subtotal: b.subtotal,
          discountPercent: b.discountPercent,
          discountAmount: b.discountAmount,
          grandTotal: b.grandTotal,
          totalItemsCount: b.items?.length || 1,
          totalQty: b.items?.reduce((sum, i) => sum + (Number(i.qty) || 1), 0) || 1,
          items: b.items || [],
          pdfUrl: b.pdfUrl || '',
        }));
      }

      setInvoices(list);

      // Dynamically compute KPI stats
      const totalCount = list.length;
      const totalSalesSum = list.reduce(
        (sum, inv) => sum + (Number(inv.grandTotal) || 0),
        0
      );
      const totalQtySum = list.reduce(
        (sum, inv) => sum + (Number(inv.totalQty) || Number(inv.totalItemsCount) || 1),
        0
      );
      const avgVal = totalCount > 0 ? totalSalesSum / totalCount : 0;

      setStats({
        totalInvoices: totalCount,
        totalSales: totalSalesSum,
        totalQtySold: totalQtySum,
        avgBillValue: avgVal,
      });
    } catch (err) {
      console.warn('Network error loading invoices, falling back to local storage:', err);
      const localBills = JSON.parse(
        localStorage.getItem('rinvox_outward_bills') || '[]'
      );
      const list = localBills.map((b, idx) => ({
        id: b.id || idx + 1,
        invoiceNumber: b.invoiceNumber,
        invoiceDate: b.invoiceDate,
        customerName: b.customer?.name || b.customerName,
        customerMobile: b.customer?.mobile || b.customerMobile,
        billingAddress: b.customer?.billingAddress || b.billingAddress,
        deliveryAddress: b.customer?.deliveryAddress || b.deliveryAddress,
        subtotal: b.subtotal,
        discountPercent: b.discountPercent,
        discountAmount: b.discountAmount,
        grandTotal: b.grandTotal,
        totalItemsCount: b.items?.length || 1,
        totalQty: b.items?.reduce((sum, i) => sum + (Number(i.qty) || 1), 0) || 1,
        items: b.items || [],
        pdfUrl: b.pdfUrl || '',
      }));

      setInvoices(list);

      const totalCount = list.length;
      const totalSalesSum = list.reduce((sum, inv) => sum + (Number(inv.grandTotal) || 0), 0);
      const totalQtySum = list.reduce((sum, inv) => sum + (Number(inv.totalQty) || 1), 0);
      const avgVal = totalCount > 0 ? totalSalesSum / totalCount : 0;

      setStats({
        totalInvoices: totalCount,
        totalSales: totalSalesSum,
        totalQtySold: totalQtySum,
        avgBillValue: avgVal,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [apiBase]);

  // Reset pagination on search or date range change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, startDate, endDate]);

  // Filtered invoices based on search and Date Range
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      // 1. Search Query filter (receipt, customer, mobile)
      const q = searchQuery.toLowerCase().trim();
      if (q) {
        const num = (inv.invoiceNumber || '').toLowerCase();
        const cust = (inv.customerName || inv.customer?.name || '').toLowerCase();
        const mob = (inv.customerMobile || inv.customer?.mobile || '').toLowerCase();
        const matchSearch = num.includes(q) || cust.includes(q) || mob.includes(q);
        if (!matchSearch) return false;
      }

      // 2. Date Range Filter
      if (startDate || endDate) {
        const rawDate = inv.invoiceDate ? new Date(inv.invoiceDate) : null;
        if (!rawDate || isNaN(rawDate.getTime())) return false;

        if (startDate) {
          const start = new Date(startDate);
          start.setHours(0, 0, 0, 0);
          if (rawDate < start) return false;
        }

        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          if (rawDate > end) return false;
        }
      }

      return true;
    });
  }, [invoices, searchQuery, startDate, endDate]);

  // Paginated invoices
  const totalPages = Math.ceil(filteredInvoices.length / pageSize) || 1;
  const paginatedInvoices = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredInvoices.slice(start, start + pageSize);
  }, [filteredInvoices, currentPage]);

  // Checkbox Selection logic
  const isAllSelected =
    paginatedInvoices.length > 0 &&
    paginatedInvoices.every((inv) =>
      selectedIds.includes(inv.id || inv.invoiceNumber)
    );

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      // Deselect all items on current page
      const pageKeys = paginatedInvoices.map((inv) => inv.id || inv.invoiceNumber);
      setSelectedIds((prev) => prev.filter((id) => !pageKeys.includes(id)));
    } else {
      // Select all items on current page
      const pageKeys = paginatedInvoices.map((inv) => inv.id || inv.invoiceNumber);
      setSelectedIds((prev) => Array.from(new Set([...prev, ...pageKeys])));
    }
  };

  const handleToggleSelectRow = (key) => {
    setSelectedIds((prev) =>
      prev.includes(key) ? prev.filter((x) => x !== key) : [...prev, key]
    );
  };

  // Export to Excel Sheet (.xlsx)
  const handleExportExcel = () => {
    const targetBills =
      selectedIds.length > 0
        ? invoices.filter((inv) =>
            selectedIds.includes(inv.id || inv.invoiceNumber)
          )
        : filteredInvoices;

    if (targetBills.length === 0) {
      showToast('No outward records found to export', 'warning');
      return;
    }

    const rows = targetBills.map((inv, idx) => ({
      'S.No': idx + 1,
      'Receipt No': inv.invoiceNumber || '-',
      'Date': inv.invoiceDate
        ? new Date(inv.invoiceDate).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          })
        : '-',
      'Customer Name': inv.customerName || inv.customer?.name || '-',
      'Mobile Number': inv.customerMobile || inv.customer?.mobile || '-',
      'Billing Address': inv.billingAddress || inv.customer?.billingAddress || '-',
      'Delivery Address': inv.deliveryAddress || inv.customer?.deliveryAddress || '-',
      'Items Count': inv.totalItemsCount || inv.items?.length || 1,
      'Total Qty': inv.totalQty || 1,
      'Subtotal (Rs.)': Number(inv.subtotal || 0).toFixed(2),
      'Discount (%)': Number(inv.discountPercent || 0),
      'Discount Amount (Rs.)': Number(inv.discountAmount || 0).toFixed(2),
      'Grand Total (Rs.)': Number(inv.grandTotal || 0).toFixed(2),
      'Receipt PDF URL': inv.pdfUrl || '-',
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);

    // Auto-adjust column widths
    const colWidths = Object.keys(rows[0] || {}).map((key) => ({
      wch: Math.max(key.length, 14),
    }));
    worksheet['!cols'] = colWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Outward Sales');

    const dateStr = new Date().toISOString().split('T')[0];
    const fileName = `AVS_Sales_Report_${dateStr}.xlsx`;
    XLSX.writeFile(workbook, fileName);

    showToast(
      `Exported ${targetBills.length} outward records to Excel successfully!`,
      'success'
    );
  };

  // WhatsApp Action with Cloudinary Link and Company Name
  const handleWhatsAppShare = (inv) => {
    const rawMobile = inv.customerMobile || inv.customer?.mobile || '';
    const cleanMobile = rawMobile.replace(/\D/g, '');

    if (!cleanMobile || cleanMobile.length < 10) {
      showToast('Valid customer mobile number is not available for this bill', 'warning');
      return;
    }

    const customerName = inv.customerName || inv.customer?.name || 'Customer';
    const billNo = inv.invoiceNumber || 'Receipt';
    const amount = Number(inv.grandTotal || 0).toFixed(2);
    const pdfUrl = inv.pdfUrl || '';

    const currentCompany = companyName || 'AVS Crackers';
    let messageText = `*${currentCompany} - Receipt Update*\n\nDear *${customerName}*,\nThank you for choosing us! Your outward bill has been generated successfully.\n\n*Receipt No:* ${billNo}\n*Amount Payable:* ₹${amount}`;

    if (pdfUrl) {
      messageText += `\n\n*Download / View Receipt PDF:*\n${pdfUrl}`;
    }

    messageText += `\n\nFor any queries, please feel free to reach out. Have a great day!`;

    const encodedText = encodeURIComponent(messageText);
    const waUrl = `https://wa.me/91${cleanMobile.slice(-10)}?text=${encodedText}`;

    window.open(waUrl, '_blank', 'noopener,noreferrer');
    showToast(`Opening WhatsApp for ${customerName}...`, 'info');
  };

  // Edit Invoice
  const handleEdit = async (inv) => {
    let target = inv;
    if ((!target.items || target.items.length === 0) && target.id) {
      try {
        const res = await fetch(`${apiBase}/api/v1/invoices/${target.id}`, {
          credentials: 'include',
        });
        if (res.ok) {
          const data = await res.json();
          if (data.data) {
            target = data.data;
          }
        }
      } catch (err) {
        console.warn('Failed to fetch full bill details for edit:', err);
      }
    }
    navigate('/sales/outward', {
      state: { editInvoice: target },
    });
  };

  // Delete Invoice
  const handleDelete = async (inv) => {
    const result = await showConfirm({
      title: 'Delete Outward Invoice?',
      text: `Are you sure you want to delete receipt "${inv.invoiceNumber}"? This cannot be undone.`,
      confirmButtonText: 'Yes, Delete',
      cancelButtonText: 'Cancel',
    });

    if (result.isConfirmed) {
      try {
        if (inv.id) {
          await fetch(`${apiBase}/api/v1/invoices/${inv.id}`, {
            method: 'DELETE',
            credentials: 'include',
          });
        }

        const localBills = JSON.parse(
          localStorage.getItem('rinvox_outward_bills') || '[]'
        );
        const updatedLocal = localBills.filter(
          (b) => b.invoiceNumber !== inv.invoiceNumber && b.id !== inv.id
        );
        localStorage.setItem('rinvox_outward_bills', JSON.stringify(updatedLocal));

        setInvoices((prev) =>
          prev.filter((item) => item.id !== inv.id && item.invoiceNumber !== inv.invoiceNumber)
        );

        setSelectedIds((prev) =>
          prev.filter((key) => key !== inv.id && key !== inv.invoiceNumber)
        );

        showToast('Invoice deleted successfully', 'success');
      } catch (err) {
        showToast('Failed to delete invoice', 'error');
      }
    }
  };

  // Define Table Columns:
  // 1. S.No removed -> replaced with Checkbox (Header Select-All + Row Checkbox)
  // 2. Uniform font: font-medium text-[#212B36] text-[13px]
  // 3. Receipt No: single line (whitespace-nowrap)
  // 4. Actions: Preview button removed, only WhatsApp, Edit, Delete
  const columns = [
    {
      key: 'checkbox',
      width: 'w-12',
      align: 'center',
      title: (
        <div className="flex items-center justify-center">
          <Checkbox
            id="select-all-outward-bills"
            checked={isAllSelected}
            onChange={handleToggleSelectAll}
          />
        </div>
      ),
      render: (_, row) => {
        const rowKey = row.id || row.invoiceNumber;
        const isChecked = selectedIds.includes(rowKey);
        return (
          <div className="flex items-center justify-center">
            <Checkbox
              id={`select-row-${rowKey}`}
              checked={isChecked}
              onChange={() => handleToggleSelectRow(rowKey)}
            />
          </div>
        );
      },
    },
    {
      key: 'invoiceNumber',
      label: 'Receipt No',
      width: 'w-48',
      render: (val, row) => (
        <button
          type="button"
          onClick={() => {
            if (row.pdfUrl) {
              window.open(row.pdfUrl, '_blank', 'noopener,noreferrer');
            } else {
              showToast('Receipt PDF link is not available yet', 'warning');
            }
          }}
          title="Click to view receipt bill"
          className="font-semibold text-[#0D3B66] hover:underline cursor-pointer text-[13px] whitespace-nowrap text-left transition-colors"
        >
          {val}
        </button>
      ),
    },
    {
      key: 'invoiceDate',
      label: 'Date',
      width: 'w-28',
      render: (val) => (
        <span className="font-medium text-[#212B36] text-[13px] whitespace-nowrap">
          {val
            ? new Date(val).toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })
            : '-'}
        </span>
      ),
    },
    {
      key: 'customerName',
      label: 'Customer Name',
      width: 'w-44',
      render: (val, row) => (
        <span className="font-medium text-[#212B36] text-[13px] whitespace-nowrap">
          {val || row.customer?.name || '-'}
        </span>
      ),
    },
    {
      key: 'customerMobile',
      label: 'Mobile Number',
      width: 'w-36',
      render: (val, row) => {
        const mob = val || row.customer?.mobile || '-';
        return (
          <span className="font-medium text-[#212B36] text-[13px] whitespace-nowrap">
            {mob}
          </span>
        );
      },
    },
    {
      key: 'items',
      label: 'Items',
      align: 'center',
      width: 'w-24',
      render: (_, row) => {
        const count = row.totalItemsCount || row.items?.length || 1;
        return (
          <span className="font-medium text-[#212B36] text-[13px] whitespace-nowrap">
            {count} {count === 1 ? 'Item' : 'Items'}
          </span>
        );
      },
    },
    {
      key: 'grandTotal',
      label: 'Total Amt',
      align: 'right',
      width: 'w-28',
      render: (val) => (
        <span className="font-medium text-[#212B36] text-[13px] whitespace-nowrap">
          ₹{Number(val || 0).toFixed(2)}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      align: 'center',
      width: 'w-36',
      render: (_, row) => (
        <div className="flex items-center justify-center gap-1.5">
          {/* WhatsApp Action with Cloudinary Link */}
          <button
            type="button"
            onClick={() => handleWhatsAppShare(row)}
            title="Share on WhatsApp"
            className="p-1.5 rounded-md bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white transition-all cursor-pointer shadow-2xs"
          >
            <FaWhatsapp className="text-[14px]" />
          </button>

          {/* Edit Action */}
          <button
            type="button"
            onClick={() => handleEdit(row)}
            title="Edit Bill"
            className="p-1.5 rounded-md bg-[#FFF5EC] text-[#FE9F43] hover:bg-[#FE9F43] hover:text-white transition-all cursor-pointer shadow-2xs"
          >
            <FiEdit2 className="text-[13px]" />
          </button>

          {/* Download Bill Action (Placed after Edit) */}
          <button
            type="button"
            onClick={() => {
              if (row.pdfUrl) {
                window.open(row.pdfUrl, '_blank', 'noopener,noreferrer');
              } else {
                showToast('Receipt PDF link is not available yet', 'warning');
              }
            }}
            title="Download / View Bill PDF"
            className="p-1.5 rounded-md bg-blue-50 text-blue-600 hover:bg-[#0D3B66] hover:text-white transition-all cursor-pointer shadow-2xs"
          >
            <FiDownload className="text-[13px]" />
          </button>

          {/* Delete Action */}
          <button
            type="button"
            onClick={() => handleDelete(row)}
            title="Delete Bill"
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
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold text-[#212B36] tracking-tight">
            Outward Bills
          </h1>
          <p className="text-[13px] font-medium text-[#646B72] mt-0.5">
            View, track, and manage all customer outward sales receipts.
          </p>
        </div>

        {/* Create Outward Button */}
        <Button
          type="button"
          variant="primary"
          leftIcon={FiPlus}
          onClick={() => navigate('/sales/outward')}
          className="px-4 py-2.5 rounded-lg text-[13px] font-bold shadow-xs whitespace-nowrap self-start sm:self-auto cursor-pointer"
        >
          Create Outward
        </Button>
      </div>

      {/* 2. KPI Cards */}
      <OutwardKpiCards stats={stats} />

      {/* 3. Main Table Card (Mobile-Responsive Padding & Overflow) */}
      <div className="bg-white rounded-xl border border-gray-100 p-3.5 sm:p-5 shadow-xs space-y-4">
        {/* Search, Date Range Filter & Excel Toolbar */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 pb-3 border-b border-gray-100">
          {/* Left: Search Bar */}
          <div className="w-full lg:w-72">
            <SearchInput
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search receipt no, customer, mobile..."
              onClear={() => setSearchQuery('')}
            />
          </div>

          {/* Right: Date Range Filter + Excel Export + Refresh */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
            {/* Date Range Inputs */}
            <div className="flex items-center gap-1.5 sm:gap-2 bg-[#F8FAFC] border border-gray-200 rounded-lg px-2.5 py-1.5 text-[12px] sm:text-[12.5px] max-w-full overflow-x-auto">
              <FiCalendar className="text-[#646B72] text-[13px] sm:text-[14px] shrink-0" />
              <div className="flex items-center gap-1 sm:gap-1.5">
                <span className="text-[#646B72] text-[10.5px] sm:text-[11px] font-bold uppercase">From</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-transparent text-[11.5px] sm:text-[12.5px] font-medium text-[#212B36] outline-none cursor-pointer"
                />
              </div>

              <span className="text-gray-300">|</span>

              <div className="flex items-center gap-1 sm:gap-1.5">
                <span className="text-[#646B72] text-[10.5px] sm:text-[11px] font-bold uppercase">To</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-transparent text-[11.5px] sm:text-[12.5px] font-medium text-[#212B36] outline-none cursor-pointer"
                />
              </div>

              {(startDate || endDate) && (
                <button
                  type="button"
                  onClick={() => {
                    setStartDate('');
                    setEndDate('');
                  }}
                  title="Clear Date Filter"
                  className="p-1 hover:bg-gray-200/70 rounded text-[#646B72] hover:text-red-600 transition-all cursor-pointer"
                >
                  <FiX className="text-[13px]" />
                </button>
              )}
            </div>

            {/* Excel Download Button */}
            <button
              type="button"
              onClick={handleExportExcel}
              title="Download Excel Sheet"
              className="flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 sm:py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[12px] sm:text-[12.5px] font-bold shadow-xs transition-all cursor-pointer"
            >
              <FiDownload className="text-[14px]" />
              <span>
                {selectedIds.length > 0
                  ? `Export (${selectedIds.length})`
                  : 'Export Excel'}
              </span>
            </button>

            {/* Refresh Button */}
            <button
              type="button"
              onClick={fetchInvoices}
              title="Refresh Data"
              className="w-8.5 h-8.5 sm:w-9.5 sm:h-9.5 bg-white border border-gray-200 text-[#646B72] hover:text-[#212B36] hover:bg-gray-50/80 rounded-lg shadow-xs flex items-center justify-center cursor-pointer transition-all active:scale-95"
            >
              <FiRefreshCw
                className={`text-[13px] sm:text-[14px] ${
                  isLoading ? 'animate-spin text-[#FE9F43]' : ''
                }`}
              />
            </button>
          </div>
        </div>

        {/* Selected count info banner if items selected */}
        {selectedIds.length > 0 && (
          <div className="flex items-center justify-between px-3.5 py-2 bg-amber-50 border border-amber-200/80 rounded-lg text-[12.5px] text-[#B45309]">
            <span className="font-semibold">
              {selectedIds.length} {selectedIds.length === 1 ? 'bill' : 'bills'} selected for export.
            </span>
            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="font-bold underline hover:text-amber-900 cursor-pointer text-[12px]"
            >
              Deselect All
            </button>
          </div>
        )}

        {/* Table: Checkbox column + Data */}
        <Table
          columns={columns}
          data={paginatedInvoices}
          keyField="id"
          emptyText={
            startDate || endDate
              ? 'No outward bills found for the selected date range.'
              : 'No outward bills found.'
          }
        />

        {/* Global Boxed Pagination */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredInvoices.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
}
