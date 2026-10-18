import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  FiCalendar,
  FiLock,
  FiUser,
  FiPhone,
  FiMapPin,
  FiTruck,
  FiPlus,
  FiTrash2,
  FiRotateCcw,
  FiPrinter,
  FiBox,
  FiAlertCircle,
} from 'react-icons/fi';
import Swal from 'sweetalert2';
import { Input, Button, Checkbox, Combobox } from '../../components/ui';
import { showToast, showConfirm } from '../../utils/alert';
import { numberToIndianWords } from '../../utils/numberToWords';
import { PaymentReceiptModal } from '../../components/bill';

export default function Outward() {
  const navigate = useNavigate();
  const location = useLocation();
  const apiBase = import.meta.env.VITE_API_BASE_URL || '';

  const [company, setCompany] = useState({});
  const [bank, setBank] = useState({});

  // Receipt Modal State (if opened manually)
  const [createdInvoiceForModal, setCreatedInvoiceForModal] = useState(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  // Fetch company & bank details for automatic PDF rendering
  useEffect(() => {
    const fetchCompanyAndBank = async () => {
      try {
        const [compRes, bankRes] = await Promise.all([
          fetch(`${apiBase}/api/v1/company`, { credentials: 'include' }),
          fetch(`${apiBase}/api/v1/bank`, { credentials: 'include' }),
        ]);
        if (compRes.ok) {
          const compData = await compRes.json();
          if (compData.data) setCompany(compData.data);
        }
        if (bankRes.ok) {
          const bankData = await bankRes.json();
          if (bankData.data) setBank(bankData.data);
        }
      } catch (err) {
        console.warn('Notice loading company or bank in Outward:', err);
      }
    };
    fetchCompanyAndBank();
  }, [apiBase]);



  // 1. Invoice Meta states
  const [editingInvoiceId, setEditingInvoiceId] = useState(null);
  const [invoiceNumber, setInvoiceNumber] = useState('REC/10/2026-27/0001');
  const [invoiceDate, setInvoiceDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0]; // Format: YYYY-MM-DD
  });

  // 2. Customer details state
  const [customer, setCustomer] = useState({
    name: '',
    mobile: '',
    billingAddress: '',
    sameAsBilling: true,
    deliveryAddress: '',
  });

  // 3. Products & categories loaded from database
  const [availableProducts, setAvailableProducts] = useState([]);
  const [availableCategories, setAvailableCategories] = useState([]);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // 4. Line items state
  const [items, setItems] = useState([
    {
      id: 1,
      productId: '',
      productName: '',
      category: '',
      unit: 'PCS',
      rate: '',
      qty: 1,
      total: 0,
    },
  ]);

  // Track duplicate selection info to highlight rows & show alerts
  const [duplicateInfo, setDuplicateInfo] = useState(null);

  // 5. Discount Percentage state (e.g. 5 for 5%)
  const [discountPercent, setDiscountPercent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch numbering settings for next Receipt Number
  useEffect(() => {
    const fetchNumbering = async () => {
      try {
        const res = await fetch(`${apiBase}/api/v1/numbering`, {
          credentials: 'include',
        });
        if (res.ok) {
          const result = await res.json();
          if (result.data) {
            const prefix = (result.data.invoicePrefix || 'REC').toUpperCase();
            const seq = result.data.currentSequence !== undefined ? result.data.currentSequence : 1;

            const now = new Date();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const year = now.getFullYear();
            const fyStart = (now.getMonth() + 1) >= 4 ? year : year - 1;
            const fyEnd = String(fyStart + 1).slice(-2);
            const formattedSeq = String(seq).padStart(4, '0');

            setInvoiceNumber(`${prefix}/${month}/${fyStart}-${fyEnd}/${formattedSeq}`);
          }
        }
      } catch (err) {
        console.warn('Failed to fetch numbering configuration:', err);
      }
    };

    fetchNumbering();
  }, [apiBase]);

  // Load existing bill if opened in Edit mode from OutwardList
  useEffect(() => {
    const initEditBill = async () => {
      if (!location.state?.editInvoice) return;
      let editInv = location.state.editInvoice;

      if (editInv.id) {
        setEditingInvoiceId(editInv.id);
      }

      // If items are missing from state, fetch complete record from backend
      if ((!editInv.items || editInv.items.length === 0) && editInv.id) {
        try {
          const res = await fetch(`${apiBase}/api/v1/invoices/${editInv.id}`, {
            credentials: 'include',
          });
          if (res.ok) {
            const data = await res.json();
            if (data.data) {
              editInv = data.data;
            }
          }
        } catch (err) {
          console.warn('Failed to fetch full invoice details for edit:', err);
        }
      }

      if (editInv.invoiceNumber) setInvoiceNumber(editInv.invoiceNumber);
      if (editInv.invoiceDate) {
        try {
          setInvoiceDate(new Date(editInv.invoiceDate).toISOString().split('T')[0]);
        } catch {
          // ignore date parse error
        }
      }
      setCustomer({
        name: editInv.customerName || editInv.customer?.name || '',
        mobile: editInv.customerMobile || editInv.customer?.mobile || '',
        billingAddress: editInv.billingAddress || editInv.customer?.billingAddress || '',
        sameAsBilling: !editInv.deliveryAddress || editInv.deliveryAddress === editInv.billingAddress,
        deliveryAddress: editInv.deliveryAddress || editInv.customer?.deliveryAddress || '',
      });

      const loadedItems = editInv.items || [];
      if (loadedItems.length > 0) {
        setItems(
          loadedItems.map((it, idx) => ({
            id: it.id || Date.now() + idx,
            productId: it.productId || it.product_id || '',
            productName: it.productName || it.product_name || '',
            category: it.category || '',
            unit: it.unit || 'PCS',
            rate: it.rate !== undefined && it.rate !== null ? it.rate : '',
            qty: it.qty !== undefined && it.qty !== null ? it.qty : 1,
            total: it.total !== undefined && it.total !== null ? it.total : (Number(it.rate || 0) * Number(it.qty || 1)),
          }))
        );
      }
      if (editInv.discountPercent !== undefined && editInv.discountPercent !== null) {
        setDiscountPercent(String(editInv.discountPercent || ''));
      }
      showToast(`Editing bill #${editInv.invoiceNumber}`, 'info');
    };

    initEditBill();
  }, [location.state, apiBase]);

  // Fetch active products and categories from database
  useEffect(() => {
    const loadMasterData = async () => {
      setIsLoadingData(true);
      try {
        const [prodRes, catRes] = await Promise.all([
          fetch(`${apiBase}/api/v1/products`, { credentials: 'include' }),
          fetch(`${apiBase}/api/v1/categories`, { credentials: 'include' }),
        ]);

        if (prodRes.ok) {
          const prodData = await prodRes.json();
          if (prodData.data) {
            setAvailableProducts(prodData.data.filter((p) => p.status));
          }
        }

        if (catRes.ok) {
          const catData = await catRes.json();
          if (catData.data) {
            setAvailableCategories(catData.data.map((c) => c.name));
          }
        }
      } catch (err) {
        console.warn('Failed to load master products/categories:', err);
      } finally {
        setIsLoadingData(false);
      }
    };

    loadMasterData();
  }, [apiBase]);

  // Category options for Combobox
  const categoryOptions = useMemo(() => {
    const catList = [
      ...availableCategories,
      ...availableProducts.map((p) => p.category).filter(Boolean),
    ];
    return Array.from(new Set(catList.map((c) => c.trim()))).map((cat) => ({
      value: cat,
      label: cat,
    }));
  }, [availableCategories, availableProducts]);

  // Customer field updates
  const handleCustomerChange = (field, value) => {
    setCustomer((prev) => ({ ...prev, [field]: value }));
  };

  // Add new product line item
  const handleAddItem = useCallback(() => {
    setItems((prev) => [
      ...prev,
      {
        id: Date.now(),
        productId: '',
        productName: '',
        category: '',
        unit: 'PCS',
        rate: '',
        qty: 1,
        total: 0,
      },
    ]);
  }, []);

  // Remove product line item
  const handleRemoveItem = (id) => {
    if (items.length <= 1) {
      showToast('At least one item row is required', 'warning');
      return;
    }
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  // Handle Category selection / typing for a row
  const handleCategorySelect = (id, selectedCategory) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          // If current product does not match new category, reset product
          const matchingProduct = availableProducts.find(
            (p) =>
              p.name === item.productName &&
              p.category &&
              p.category.toLowerCase().trim() === (selectedCategory || '').toLowerCase().trim()
          );

          if (!matchingProduct) {
            return {
              ...item,
              category: selectedCategory,
              productId: '',
              productName: '',
              rate: '',
              total: 0,
            };
          }

          return { ...item, category: selectedCategory };
        }
        return item;
      })
    );
  };

  // Handle Product selection with duplicate product detection
  const handleProductSelect = (id, selectedName) => {
    if (!selectedName) {
      setItems((prev) =>
        prev.map((item) =>
          item.id === id
            ? { ...item, productId: '', productName: '', rate: '', total: 0 }
            : item
        )
      );
      return;
    }

    // Check if another row already has this product
    const existingIndex = items.findIndex(
      (item) =>
        item.id !== id &&
        item.productName &&
        item.productName.toLowerCase().trim() === selectedName.toLowerCase().trim()
    );

    if (existingIndex !== -1) {
      const existingRow = items[existingIndex];
      setDuplicateInfo({
        currentRowId: id,
        existingRowId: existingRow.id,
        productName: selectedName,
        existingIndex: existingIndex + 1,
      });

      showToast(`Duplicated product! "${selectedName}" is already added in row #${existingIndex + 1}.`, 'error');

      setTimeout(() => {
        setDuplicateInfo(null);
      }, 4500);
      return;
    }

    const selectedProd = availableProducts.find((p) => p.name === selectedName);

    setItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          if (!selectedProd) {
            return {
              ...item,
              productId: '',
              productName: '',
              rate: '',
              total: 0,
            };
          }

          const rate = Number(selectedProd.sellingPrice || 0);
          const qty = Number(item.qty || 1);
          return {
            ...item,
            productId: selectedProd.id,
            productName: selectedProd.name,
            category: selectedProd.category || item.category || '',
            unit: selectedProd.unit || 'PCS',
            rate: rate,
            total: rate * qty,
          };
        }
        return item;
      })
    );
  };

  // Update item rate or quantity
  const handleItemValueChange = (id, field, value) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const updated = { ...item, [field]: value };
          const rate = Number(field === 'rate' ? value : updated.rate) || 0;
          const qty = Number(field === 'qty' ? value : updated.qty) || 0;
          updated.total = rate * qty;
          return updated;
        }
        return item;
      })
    );
  };

  // Calculations
  const subtotal = items.reduce((sum, item) => sum + (Number(item.total) || 0), 0);
  const discountRate = Math.min(100, Math.max(0, Number(discountPercent) || 0));
  const discountAmount = (subtotal * discountRate) / 100;
  const grandTotal = Math.max(0, subtotal - discountAmount);
  const wordsAmount = numberToIndianWords(grandTotal);

  // Return products filtered strictly by the row's selected category
  const getProductOptionsForRow = (rowCategory) => {
    let prods = availableProducts;
    if (rowCategory && rowCategory.trim()) {
      prods = prods.filter(
        (p) =>
          p.category &&
          p.category.toLowerCase().trim() === rowCategory.toLowerCase().trim()
      );
    }
    return prods.map((p) => ({
      value: p.name,
      label: p.name,
      sublabel: `₹${Number(p.sellingPrice).toFixed(2)} | ${p.unit || 'PCS'}`,
    }));
  };

  // Form Reset
  const handleResetBill = useCallback(async () => {
    const result = await showConfirm({
      title: 'Reset Outward Bill?',
      text: 'Are you sure you want to clear this bill? All entered customer and item details will be discarded.',
      confirmButtonText: 'Yes, Reset',
      cancelButtonText: 'Cancel',
    });

    if (result.isConfirmed) {
      setCustomer({
        name: '',
        mobile: '',
        billingAddress: '',
        sameAsBilling: true,
        deliveryAddress: '',
      });
      setItems([
        {
          id: Date.now(),
          productId: '',
          productName: '',
          category: '',
          unit: 'PCS',
          rate: '',
          qty: 1,
          total: 0,
        },
      ]);
      setDiscountPercent('');
      setDuplicateInfo(null);
      showToast('Bill form reset successfully', 'success');
    }
  }, []);

  // Form Save - Backend Direct PDF Generation & Cloudinary Upload (Option A)
  const handleSaveBill = useCallback(async () => {
    if (!customer.name.trim()) {
      showToast('Please enter customer name', 'warning');
      return;
    }
    if (!customer.mobile.trim() || !/^\d{10}$/.test(customer.mobile.trim())) {
      showToast('Please enter a valid 10-digit mobile number', 'warning');
      return;
    }
    if (!customer.billingAddress.trim()) {
      showToast('Please enter billing address', 'warning');
      return;
    }
    if (!customer.sameAsBilling && !customer.deliveryAddress.trim()) {
      showToast('Please enter delivery address', 'warning');
      return;
    }

    const validItems = items.filter((i) => i.productName && Number(i.qty) > 0);
    if (validItems.length === 0) {
      showToast('Please select at least one product with quantity', 'warning');
      return;
    }

    setIsSubmitting(true);

    // Fullscreen loading lock to prevent clicking other menus/buttons
    Swal.fire({
      title: 'Generating Bill...',
      html: 'Please wait while we generate your bill.',
      allowOutsideClick: false,
      allowEscapeKey: false,
      allowEnterKey: false,
      showConfirmButton: false,
      didOpen: () => {
        Swal.showLoading();
      },
      customClass: {
        popup: 'rounded-3xl shadow-2xl p-6 font-["Nunito",sans-serif]',
        title: 'text-[18px] font-bold text-[#0D3B66]',
        htmlContainer: 'text-[13px] text-[#646B72]',
      },
    });

    try {
      // 1. Prepare payload - backend handles pure vector A4 PDF generation & Cloudinary raw upload
      const payload = {
        invoice: {
          invoiceNumber,
          invoiceDate,
          customerName: customer.name.trim(),
          customerMobile: customer.mobile.trim(),
          billingAddress: customer.billingAddress.trim(),
          deliveryAddress: customer.sameAsBilling
            ? customer.billingAddress.trim()
            : customer.deliveryAddress.trim(),
          subtotal,
          discountPercent: discountRate,
          discountAmount,
          grandTotal,
          totalItemsCount: validItems.length,
          totalQty: validItems.reduce((sum, i) => sum + (Number(i.qty) || 1), 0),
          amountInWords: wordsAmount,
        },
        items: validItems.map((item) => ({
          productId: item.productId || null,
          productName: item.productName,
          category: item.category,
          unit: item.unit,
          rate: Number(item.rate),
          qty: Number(item.qty),
          total: Number(item.total),
        })),
      };

      let createdInvoiceObj = {
        ...payload.invoice,
        customer: {
          name: customer.name.trim(),
          mobile: customer.mobile.trim(),
          billingAddress: customer.billingAddress.trim(),
          deliveryAddress: customer.sameAsBilling
            ? customer.billingAddress.trim()
            : customer.deliveryAddress.trim(),
        },
        items: validItems,
        pdfUrl: '',
      };

      const isEditing = Boolean(editingInvoiceId);
      const url = isEditing
        ? `${apiBase}/api/v1/invoices/${editingInvoiceId}`
        : `${apiBase}/api/v1/invoices`;
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      const resData = await res.json();
      if (!res.ok || !resData.success) {
        throw new Error(resData.message || 'Failed to save bill on server');
      }

      createdInvoiceObj = resData.data;

      // Save to localStorage cache with uploaded pdfUrl
      const savedBills = JSON.parse(localStorage.getItem('rinvox_outward_bills') || '[]');
      if (isEditing) {
        const updated = savedBills.map((b) =>
          b.id === editingInvoiceId || b.invoiceNumber === createdInvoiceObj.invoiceNumber
            ? createdInvoiceObj
            : b
        );
        localStorage.setItem('rinvox_outward_bills', JSON.stringify(updated));
      } else {
        localStorage.setItem('rinvox_outward_bills', JSON.stringify([createdInvoiceObj, ...savedBills]));
      }

      const savedBillNumber = isEditing
        ? (createdInvoiceObj?.invoiceNumber || invoiceNumber)
        : (createdInvoiceObj?.invoiceNumber || invoiceNumber);
      const targetCustomerMobile = customer.mobile.trim();
      const targetCustomerName = customer.name.trim();
      const finalPdfUrl = createdInvoiceObj.pdfUrl || '';

      setEditingInvoiceId(null);

      // Clear form for next bill in background
      setCustomer({
        name: '',
        mobile: '',
        billingAddress: '',
        sameAsBilling: true,
        deliveryAddress: '',
      });
      setItems([
        {
          id: Date.now(),
          productId: '',
          productName: '',
          category: '',
          unit: 'PCS',
          rate: '',
          qty: 1,
          total: 0,
        },
      ]);
      setDiscountPercent('');
      setDuplicateInfo(null);

      // Fetch next numbering sequence ONLY if creating a brand new bill
      if (!isEditing) {
        try {
          const numRes = await fetch(`${apiBase}/api/v1/numbering`, { credentials: 'include' });
          if (numRes.ok) {
            const numData = await numRes.json();
            if (numData.data) {
              const prefix = (numData.data.invoicePrefix || 'REC').toUpperCase();
              const seq = numData.data.currentSequence !== undefined ? numData.data.currentSequence : 1;
              const now = new Date();
              const month = String(now.getMonth() + 1).padStart(2, '0');
              const year = now.getFullYear();
              const fyStart = (now.getMonth() + 1) >= 4 ? year : year - 1;
              const fyEnd = String(fyStart + 1).slice(-2);
              const formattedSeq = String(seq).padStart(4, '0');
              setInvoiceNumber(`${prefix}/${month}/${fyStart}-${fyEnd}/${formattedSeq}`);
            }
          }
        } catch (numErr) {
          console.warn('Notice updating numbering sequence:', numErr);
        }
      }

      // SweetAlert Action Modal with 2 buttons: "Send Receipt WhatsApp" and "View Outward List"
      const actionRes = await Swal.fire({
        title: isEditing ? 'Bill Updated & Receipt Uploaded!' : 'Bill Saved & Receipt Uploaded!',
        html: `Receipt <b>${savedBillNumber}</b> for <b>₹${grandTotal.toFixed(2)}</b> has been ${isEditing ? 'updated' : 'generated'} and uploaded to Cloudinary successfully.`,
        icon: 'success',
        showCancelButton: true,
        confirmButtonText: 'Send Receipt WhatsApp',
        cancelButtonText: 'View Outward List',
        confirmButtonColor: '#10B981',
        cancelButtonColor: '#0D3B66',
        reverseButtons: false,
        customClass: {
          popup: 'rounded-3xl shadow-2xl p-6 font-["Nunito",sans-serif]',
          title: 'text-[20px] font-bold text-[#212B36]',
          htmlContainer: 'text-[14px] font-medium text-[#646B72]',
          confirmButton: 'rounded-xl px-5 py-2.5 font-bold text-[13.5px] bg-emerald-500 hover:bg-emerald-600 shadow-md cursor-pointer',
          cancelButton: 'rounded-xl px-5 py-2.5 font-bold text-[13.5px] bg-[#0D3B66] hover:bg-[#0D3B66]/90 text-white shadow-md cursor-pointer',
        },
      });

      if (actionRes.isConfirmed) {
        const currentCompany = company.companyName || company.company_name || 'AVS Crackers';
        let messageText = `*${currentCompany} - Receipt Update*\n\nDear *${targetCustomerName}*,\nThank you for choosing us! Your outward bill has been ${isEditing ? 'updated' : 'generated'} successfully.\n\n*Receipt No:* ${savedBillNumber}\n*Amount Payable:* ₹${grandTotal.toFixed(2)}`;

        if (finalPdfUrl) {
          messageText += `\n\n*Download / View Receipt PDF:*\n${finalPdfUrl}`;
        }

        messageText += `\n\nFor any queries, please feel free to reach out. Have a great day!`;

        const encodedText = encodeURIComponent(messageText);
        const cleanMobile = targetCustomerMobile.replace(/\D/g, '');
        const waUrl = `https://wa.me/91${cleanMobile.slice(-10)}?text=${encodedText}`;

        window.open(waUrl, '_blank', 'noopener,noreferrer');
        navigate('/sales/outward-list');
      } else {
        navigate('/sales/outward-list');
      }
    } catch (err) {
      Swal.close();
      showToast(err.message || 'Failed to save bill', 'error');
    } finally {
      setIsSubmitting(false);
    }
  }, [
    customer,
    items,
    invoiceNumber,
    invoiceDate,
    subtotal,
    discountRate,
    discountAmount,
    grandTotal,
    wordsAmount,
    company,
    apiBase,
    navigate,
  ]);


  // Global Keyboard Shortcuts (Ctrl + Enter: Save, Alt + A: Add, Alt + R: Reset)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        handleSaveBill();
      }
      if (e.altKey && (e.key === 'a' || e.key === 'A')) {
        e.preventDefault();
        handleAddItem();
      }
      if (e.altKey && (e.key === 'r' || e.key === 'R')) {
        e.preventDefault();
        handleResetBill();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSaveBill, handleAddItem, handleResetBill]);

  // Selected items list for summary breakdown
  const selectedItemsList = useMemo(() => {
    return items.filter((i) => i.productName && Number(i.qty) > 0);
  }, [items]);

  return (
    <div className="space-y-6">
      {/* ================= TOP HEADER BAR ================= */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-[20px] sm:text-[22px] font-bold text-[#212B36] tracking-tight">
            Outward (Billing)
          </h1>
          <p className="text-[12px] sm:text-[13px] font-medium text-[#646B72] mt-0.5">
            Generate and manage customer outward sales invoices.
          </p>
        </div>

        {/* Responsive Meta Bar: Receipt No + Bill Date */}
        <div className="flex flex-col sm:flex-row sm:items-center bg-[#F8FAFC] border border-gray-200 rounded-lg p-2.5 sm:px-4 sm:py-2 shadow-2xs divide-y sm:divide-y-0 sm:divide-x divide-gray-200 w-full sm:w-auto gap-2 sm:gap-0">
          {/* Receipt No */}
          <div className="flex items-center justify-between sm:justify-start gap-2 sm:pr-4 pb-2 sm:pb-0">
            <div className="flex items-center gap-1.5">
              <FiLock className="text-[13px] text-[#646B72]" />
              <span className="text-[11px] font-bold text-[#646B72] uppercase tracking-wider">
                Receipt No:
              </span>
            </div>
            <span className="text-[13px] sm:text-[13.5px] font-extrabold text-[#212B36] font-mono tracking-wide">
              {invoiceNumber}
            </span>
          </div>

          {/* Bill Date */}
          <div className="flex items-center justify-between sm:justify-start gap-2 sm:pl-4 pt-2 sm:pt-0">
            <div className="flex items-center gap-1.5">
              <FiCalendar className="text-[13px] text-[#FE9F43]" />
              <span className="text-[11px] font-bold text-[#646B72] uppercase tracking-wider">
                Bill Date:
              </span>
            </div>
            <input
              type="date"
              value={invoiceDate}
              onChange={(e) => setInvoiceDate(e.target.value)}
              className="text-[13px] font-bold text-[#212B36] bg-transparent outline-none cursor-pointer text-right sm:text-left"
            />
          </div>
        </div>
      </div>

      {/* ================= MAIN 2-COLUMN RESPONSIVE LAYOUT ================= */}
      <div className="flex flex-col xl:flex-row gap-5 items-start">
        {/* ================= LEFT COLUMN: CUSTOMER + LINE ITEMS (COMPACT BALANCED WIDTH) ================= */}
        <div className="w-full xl:max-w-[780px] 2xl:max-w-[840px] space-y-5">
          {/* CARD 1: Customer Details */}
          <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <FiUser className="text-[16px] text-[#FE9F43]" />
                <h2 className="text-[15px] font-bold text-[#212B36]">
                  Customer Details
                </h2>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Customer Name */}
              <div>
                <Input
                  id="custName"
                  name="custName"
                  label="Customer Name"
                  required
                  value={customer.name}
                  onChange={(e) => handleCustomerChange('name', e.target.value)}
                  placeholder="Enter customer name"
                  leftIcon={FiUser}
                />
              </div>

              {/* Mobile Number */}
              <div>
                <Input
                  id="custMobile"
                  name="custMobile"
                  type="tel"
                  maxLength={10}
                  label="Mobile Number"
                  required
                  value={customer.mobile}
                  onChange={(e) =>
                    handleCustomerChange(
                      'mobile',
                      e.target.value.replace(/\D/g, '').slice(0, 10)
                    )
                  }
                  placeholder="10-digit mobile number"
                  leftIcon={FiPhone}
                />
              </div>

              {/* Billing Address */}
              <div className="md:col-span-2">
                <label
                  htmlFor="custBillingAddress"
                  className="text-[12.5px] font-semibold text-[#212B36] flex items-center gap-1 mb-1"
                >
                  <FiMapPin className="text-[13px] text-[#646B72]" />
                  <span>
                    Billing Address <span className="text-red-500">*</span>
                  </span>
                </label>
                <textarea
                  id="custBillingAddress"
                  rows="2"
                  value={customer.billingAddress}
                  onChange={(e) =>
                    handleCustomerChange('billingAddress', e.target.value)
                  }
                  placeholder="Enter complete billing address"
                  className="w-full py-2.5 px-3.5 bg-[#F7F7F7] border border-gray-100 rounded-lg text-[13.5px] font-medium text-[#212B36] placeholder-[#646B72]/60 focus:bg-white focus:border-[#FE9F43] focus:ring-2 focus:ring-[#FE9F43]/15 outline-none transition-all resize-none shadow-2xs"
                />
              </div>

              {/* Delivery Address Checkbox Toggle */}
              <div className="md:col-span-2 pt-1">
                <Checkbox
                  id="sameAsBillingCheck"
                  checked={customer.sameAsBilling}
                  onChange={(e) =>
                    handleCustomerChange('sameAsBilling', e.target.checked)
                  }
                  label="Delivery address same as billing address"
                />
              </div>

              {/* Dynamic Delivery Address */}
              {!customer.sameAsBilling && (
                <div className="md:col-span-2 pt-1">
                  <label
                    htmlFor="custDeliveryAddress"
                    className="text-[12.5px] font-semibold text-[#212B36] flex items-center gap-1 mb-1"
                  >
                    <FiTruck className="text-[13px] text-[#FE9F43]" />
                    <span>
                      Delivery Address <span className="text-red-500">*</span>
                    </span>
                  </label>
                  <textarea
                    id="custDeliveryAddress"
                    rows="2"
                    value={customer.deliveryAddress}
                    onChange={(e) =>
                      handleCustomerChange('deliveryAddress', e.target.value)
                    }
                    placeholder="Enter delivery / shipping destination address"
                    className="w-full py-2.5 px-3.5 bg-[#F7F7F7] border border-gray-100 rounded-lg text-[13.5px] font-medium text-[#212B36] placeholder-[#646B72]/60 focus:bg-white focus:border-[#FE9F43] focus:ring-2 focus:ring-[#FE9F43]/15 outline-none transition-all resize-none shadow-2xs"
                  />
                </div>
              )}
            </div>
          </div>

          {/* CARD 2: Product Line Items Table */}
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <FiBox className="text-[16px] text-[#FE9F43]" />
                <h2 className="text-[15px] font-bold text-[#212B36]">
                  Product Line Items
                </h2>
                <span className="text-[11.5px] font-bold px-2 py-0.5 rounded-md bg-gray-100 text-[#646B72]">
                  {items.length} {items.length === 1 ? 'row' : 'rows'}
                </span>
              </div>

              {/* Add Item Button */}
              <button
                type="button"
                onClick={handleAddItem}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-lg text-[12px] sm:text-[13px] font-bold bg-[#FFF5EC] text-[#FE9F43] hover:bg-[#FE9F43] hover:text-white transition-all cursor-pointer shadow-2xs"
              >
                <FiPlus className="text-[14px]" />
                <span className="hidden sm:inline">Add Item (Alt+A)</span>
                <span className="sm:hidden">Add Item</span>
              </button>
            </div>

            {/* Duplicate Notice Alert Banner (Cleanly displayed above table - zero overlap) */}
            {duplicateInfo && (
              <div className="flex items-center justify-between px-3.5 py-2.5 bg-red-50 border border-red-200 rounded-lg text-red-700 text-[12.5px] font-medium animate-in fade-in duration-200">
                <div className="flex items-center gap-2">
                  <FiAlertCircle className="text-[16px] text-red-600 shrink-0" />
                  <span>
                    <strong className="font-bold">Duplicate Product:</strong> &ldquo;{duplicateInfo.productName}&rdquo; is already added in <strong className="font-bold">Row #{duplicateInfo.existingIndex}</strong>.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setDuplicateInfo(null)}
                  className="text-red-500 hover:text-red-800 text-[11.5px] font-bold px-2 py-0.5 rounded hover:bg-red-100 transition-colors cursor-pointer shrink-0"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* ================= DESKTOP / TABLET VIEW: FULL TABLE (md and above) ================= */}
            <div className="hidden md:block rounded-lg border border-gray-100 overflow-visible relative">
              <table className="w-full text-left border-collapse table-fixed">
                <thead>
                  <tr className="bg-[#F8FAFC] border-b border-gray-100 text-[11.5px] font-bold text-[#646B72] uppercase tracking-wider">
                    <th className="py-3 px-2 text-center w-9">S.No</th>
                    <th className="py-3 px-2 w-[24%]">Category</th>
                    <th className="py-3 px-2 w-[30%]">Product Name</th>
                    <th className="py-3 px-2 text-center w-14">Unit</th>
                    <th className="py-3 px-2 text-right w-28">Rate (₹)</th>
                    <th className="py-3 px-2 text-center w-20">Qty</th>
                    <th className="py-3 px-2 text-right w-24">Total (₹)</th>
                    <th className="py-3 px-1 text-center w-9"></th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100 text-[13px]">
                  {items.map((item, index) => {
                    const isCurrentDup = duplicateInfo?.currentRowId === item.id;
                    const isExistingDup = duplicateInfo?.existingRowId === item.id;
                    const isDup = isCurrentDup || isExistingDup;

                    return (
                      <tr
                        key={item.id}
                        className={`transition-colors ${
                          isCurrentDup
                            ? 'bg-red-50/70 ring-2 ring-red-400 ring-inset'
                            : isExistingDup
                            ? 'bg-amber-50/60 ring-1 ring-amber-300 ring-inset'
                            : 'hover:bg-[#FFF9F3]/30'
                        }`}
                      >
                        {/* S.No */}
                        <td className="py-2.5 px-2 text-center font-bold text-[#646B72]">
                          {isCurrentDup ? (
                            <span
                              className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-600 text-white text-[10.5px] font-extrabold shadow-2xs"
                              title={`Duplicate of Row #${duplicateInfo.existingIndex}`}
                            >
                              !
                            </span>
                          ) : isExistingDup ? (
                            <span
                              className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-500 text-white text-[10px] font-extrabold shadow-2xs"
                              title="Original Item"
                            >
                              {index + 1}
                            </span>
                          ) : (
                            index + 1
                          )}
                        </td>

                        {/* Category Combobox */}
                        <td className="py-2.5 px-2">
                          <Combobox
                            value={item.category}
                            onChange={(val) => handleCategorySelect(item.id, val)}
                            options={categoryOptions}
                            placeholder="Select Category"
                          />
                        </td>

                        {/* Product Name Combobox (Highlighted on duplicate) */}
                        <td className="py-2.5 px-2">
                          <Combobox
                            value={item.productName}
                            onChange={(val) => handleProductSelect(item.id, val)}
                            options={getProductOptionsForRow(item.category)}
                            hasError={isDup}
                            placeholder={
                              isLoadingData
                                ? 'Loading...'
                                : item.category
                                ? `Search ${item.category}...`
                                : 'Search product...'
                            }
                          />
                        </td>

                        {/* Unit */}
                        <td className="py-2.5 px-2 text-center">
                          <span className="px-1.5 py-1 rounded-md text-[11px] font-bold bg-gray-100 text-[#646B72] block truncate">
                            {item.unit || 'PCS'}
                          </span>
                        </td>

                        {/* Rate (Wider w-28 input) */}
                        <td className="py-2.5 px-2 text-right">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={item.rate}
                            onChange={(e) =>
                              handleItemValueChange(item.id, 'rate', e.target.value)
                            }
                            placeholder="0.00"
                            className="w-full text-right py-2 px-3 bg-white border border-gray-200 rounded-lg text-[13.5px] font-bold text-[#212B36] outline-none focus:border-[#FE9F43] focus:ring-1 focus:ring-[#FE9F43]/20 shadow-2xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                        </td>

                        {/* Quantity (Wider w-20 input) */}
                        <td className="py-2.5 px-2 text-center">
                          <input
                            type="number"
                            min="1"
                            value={item.qty}
                            onChange={(e) =>
                              handleItemValueChange(
                                item.id,
                                'qty',
                                Math.max(1, parseInt(e.target.value) || 1)
                              )
                            }
                            className="w-full text-center py-2 px-3 bg-white border border-gray-200 rounded-lg text-[13.5px] font-bold text-[#212B36] outline-none focus:border-[#FE9F43] focus:ring-1 focus:ring-[#FE9F43]/20 shadow-2xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                        </td>

                        {/* Total Amount */}
                        <td className="py-2.5 px-2 text-right font-extrabold text-[#212B36] text-[13.5px]">
                          ₹{Number(item.total || 0).toFixed(2)}
                        </td>

                        {/* Delete Action (tabIndex=-1 so Tab advances directly to next row inputs) */}
                        <td className="py-2.5 px-1 text-center">
                          <button
                            type="button"
                            tabIndex={-1}
                            onClick={() => handleRemoveItem(item.id)}
                            title="Remove row"
                            className="p-1 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all cursor-pointer"
                          >
                            <FiTrash2 className="text-[13px]" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* ================= MOBILE VIEW: TOUCH-FRIENDLY ITEM CARDS (screens < md) ================= */}
            <div className="block md:hidden space-y-3">
              {items.map((item, index) => {
                const isCurrentDup = duplicateInfo?.currentRowId === item.id;
                const isExistingDup = duplicateInfo?.existingRowId === item.id;
                const isDup = isCurrentDup || isExistingDup;

                return (
                  <div
                    key={item.id}
                    className={`p-3.5 rounded-xl border transition-all ${
                      isCurrentDup
                        ? 'bg-red-50/70 border-red-300 ring-2 ring-red-400'
                        : isExistingDup
                        ? 'bg-amber-50/60 border-amber-300 ring-1 ring-amber-300'
                        : 'bg-[#FAFAFA] border-gray-200 shadow-2xs'
                    }`}
                  >
                    {/* Card Header: Item Badge, Title & Delete */}
                    <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-gray-200/80">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-5 h-5 rounded-full text-[10.5px] font-bold flex items-center justify-center ${
                            isCurrentDup
                              ? 'bg-red-600 text-white'
                              : isExistingDup
                              ? 'bg-amber-500 text-white'
                              : 'bg-[#FE9F43]/15 text-[#FE9F43]'
                          }`}
                        >
                          {isCurrentDup ? '!' : index + 1}
                        </span>
                        <span className="text-[12.5px] font-bold text-[#212B36] truncate max-w-[180px]">
                          {item.productName || `Item #${index + 1}`}
                        </span>
                        {isCurrentDup && (
                          <span className="text-[9.5px] font-extrabold text-red-600 bg-red-100 px-1.5 py-0.5 rounded">
                            Duplicate
                          </span>
                        )}
                      </div>

                      {items.length > 1 && (
                        <button
                          type="button"
                          tabIndex={-1}
                          onClick={() => handleRemoveItem(item.id)}
                          className="text-gray-400 hover:text-red-500 p-1 rounded-md transition-colors cursor-pointer"
                          title="Remove item"
                        >
                          <FiTrash2 className="text-[14px]" />
                        </button>
                      )}
                    </div>

                    {/* Inputs Stack */}
                    <div className="space-y-2.5">
                      {/* Category */}
                      <div>
                        <label className="text-[10.5px] font-bold text-[#646B72] uppercase tracking-wider block mb-1">
                          Category
                        </label>
                        <Combobox
                          value={item.category}
                          onChange={(val) => handleCategorySelect(item.id, val)}
                          options={categoryOptions}
                          placeholder="Select Category"
                        />
                      </div>

                      {/* Product Name */}
                      <div>
                        <label className="text-[10.5px] font-bold text-[#646B72] uppercase tracking-wider block mb-1">
                          Product Name
                        </label>
                        <Combobox
                          value={item.productName}
                          onChange={(val) => handleProductSelect(item.id, val)}
                          options={getProductOptionsForRow(item.category)}
                          hasError={isDup}
                          placeholder={
                            isLoadingData
                              ? 'Loading...'
                              : item.category
                              ? `Search ${item.category}...`
                              : 'Search product...'
                          }
                        />
                      </div>

                      {/* Rate, Qty, Unit, and Row Total Grid */}
                      <div className="grid grid-cols-3 gap-2 pt-1 items-end">
                        {/* Rate */}
                        <div>
                          <label className="text-[10.5px] font-bold text-[#646B72] uppercase tracking-wider block mb-1">
                            Rate (₹)
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={item.rate}
                            onChange={(e) =>
                              handleItemValueChange(item.id, 'rate', e.target.value)
                            }
                            placeholder="0.00"
                            className="w-full text-right py-2 px-2.5 bg-white border border-gray-200 rounded-lg text-[13px] font-bold text-[#212B36] outline-none focus:border-[#FE9F43] shadow-2xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                        </div>

                        {/* Qty */}
                        <div>
                          <label className="text-[10.5px] font-bold text-[#646B72] uppercase tracking-wider block mb-1 truncate">
                            Qty ({item.unit || 'PCS'})
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={item.qty}
                            onChange={(e) =>
                              handleItemValueChange(
                                item.id,
                                'qty',
                                Math.max(1, parseInt(e.target.value) || 1)
                              )
                            }
                            className="w-full text-center py-2 px-2 bg-white border border-gray-200 rounded-lg text-[13px] font-bold text-[#212B36] outline-none focus:border-[#FE9F43] shadow-2xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                        </div>

                        {/* Line Total */}
                        <div className="text-right pb-1">
                          <span className="text-[10.5px] font-bold text-[#646B72] uppercase tracking-wider block mb-1">
                            Total
                          </span>
                          <span className="text-[14.5px] font-black text-[#FE9F43] block">
                            ₹{Number(item.total || 0).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Dotted Quick Add Button */}
            <button
              type="button"
              onClick={handleAddItem}
              className="w-full py-2.5 sm:py-3 border-2 border-dashed border-gray-200 hover:border-[#FE9F43] hover:bg-[#FFF5EC]/40 rounded-lg text-[12.5px] sm:text-[13px] font-bold text-[#646B72] hover:text-[#FE9F43] transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <FiPlus className="text-[14px] sm:text-[15px]" />
              <span className="hidden sm:inline">Add Another Item Row (Alt + A)</span>
              <span className="sm:hidden">Add Another Item Row</span>
            </button>
          </div>
        </div>

        {/* ================= RIGHT COLUMN: BILL SUMMARY CARD (RESPONSIVE STICKY) ================= */}
        <div className="w-full xl:w-[320px] 2xl:w-[340px] shrink-0 xl:sticky xl:top-[86px] space-y-4">
          <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h2 className="text-[16px] font-bold text-[#212B36]">
                Bill Summary
              </h2>
              <span className="text-[12px] font-bold px-2 py-0.5 rounded-md bg-gray-100 text-[#646B72]">
                {selectedItemsList.length} {selectedItemsList.length === 1 ? 'Item' : 'Items'}
              </span>
            </div>

            {/* 1. Itemized Product Breakdown List with Quantities */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-[#646B72] uppercase tracking-wider block">
                Item Breakdown
              </span>

              <div className="bg-[#F8FAFC] border border-gray-100 rounded-lg p-3 max-h-48 overflow-y-auto divide-y divide-gray-100 space-y-2">
                {selectedItemsList.length > 0 ? (
                  selectedItemsList.map((item, idx) => (
                    <div
                      key={item.id}
                      className={`flex items-start justify-between text-[12.5px] ${
                        idx > 0 ? 'pt-2' : ''
                      }`}
                    >
                      <div className="flex flex-col truncate pr-2">
                        <span className="font-bold text-[#212B36] truncate">
                          {item.productName}
                        </span>
                        <span className="text-[11px] font-medium text-[#646B72]">
                          Qty: <span className="font-bold text-[#212B36]">{item.qty} {item.unit}</span> × ₹{Number(item.rate || 0).toFixed(2)}
                        </span>
                      </div>

                      <span className="font-extrabold text-[#212B36] shrink-0 text-[13px]">
                        ₹{Number(item.total || 0).toFixed(2)}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="py-4 text-center text-[12px] text-[#646B72]">
                    No items added to bill yet
                  </div>
                )}
              </div>
            </div>

            {/* 2. Price Calculations Breakdown */}
            <div className="space-y-3 text-[13px] pt-1 border-t border-gray-100">
              {/* Subtotal */}
              <div className="flex items-center justify-between text-[#646B72]">
                <span className="font-medium">Subtotal</span>
                <span className="font-extrabold text-[#212B36]">
                  ₹{subtotal.toFixed(2)}
                </span>
              </div>

              {/* Discount as Percentage (%) */}
              <div className="flex items-center justify-between text-[#646B72]">
                <div className="flex items-center gap-1 font-medium">
                  <span>Discount</span>
                  {discountRate > 0 && (
                    <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-1 py-0.2 rounded">
                      ({discountRate}%)
                    </span>
                  )}
                </div>

                <div className="relative w-24">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={discountPercent}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '' || (Number(val) >= 0 && Number(val) <= 100)) {
                        setDiscountPercent(val);
                      }
                    }}
                    placeholder="0"
                    className="w-full text-right py-2 pl-2 pr-6 bg-white border border-gray-200 rounded-lg text-[13px] font-bold text-[#212B36] outline-none focus:border-[#FE9F43] focus:ring-1 focus:ring-[#FE9F43]/20 shadow-2xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <div className="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none text-[#646B72] font-bold text-[12px]">
                    %
                  </div>
                </div>
              </div>

              {/* Discount Savings */}
              {discountRate > 0 && (
                <div className="flex items-center justify-between text-[11.5px] text-emerald-600 font-semibold">
                  <span>Discount Savings</span>
                  <span>-₹{discountAmount.toFixed(2)}</span>
                </div>
              )}

              <div className="border-t border-dashed border-gray-200 my-2"></div>

              {/* Grand Total Display */}
              <div className="bg-[#FFF5EC] border border-[#FFE7D3] rounded-xl p-3.5">
                <span className="text-[10.5px] font-bold text-[#FE9F43] uppercase tracking-wider block">
                  Grand Total
                </span>
                <div className="flex items-baseline justify-between mt-0.5">
                  <span className="text-[24px] font-black text-[#FE9F43] tracking-tight">
                    ₹{grandTotal.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Amount In Words */}
              <div className="p-2.5 bg-[#F8FAFC] border border-gray-100 rounded-lg">
                <span className="text-[10px] font-bold text-[#646B72] uppercase tracking-wider block">
                  Amount in Words
                </span>
                <p className="text-[11.5px] font-bold text-[#212B36] mt-0.5 leading-snug">
                  {wordsAmount}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-2">
              {/* Save & Print Bill */}
              <Button
                type="button"
                variant="primary"
                fullWidth
                loading={isSubmitting}
                leftIcon={FiPrinter}
                onClick={handleSaveBill}
                className="py-2.5 text-[13.5px] font-bold shadow-md shadow-[#FE9F43]/20"
              >
                {editingInvoiceId ? 'Update & Generate Bill' : 'Save & Generate Bill'}
              </Button>

              {/* Reset Form */}
              <Button
                type="button"
                variant="ghost"
                fullWidth
                leftIcon={FiRotateCcw}
                onClick={handleResetBill}
                className="border border-gray-200 text-[#646B72] hover:text-[#212B36] hover:bg-gray-50 py-2 text-[12.5px]"
              >
                Reset Bill
              </Button>
            </div>
          </div>
        </div>
      </div>
      {/* Payment Receipt Preview & Cloudinary Upload Modal (Optional Manual View) */}
      <PaymentReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => {
          setIsReceiptModalOpen(false);
          navigate('/sales/outward-list');
        }}
        invoice={createdInvoiceForModal}
      />
    </div>
  );
}


