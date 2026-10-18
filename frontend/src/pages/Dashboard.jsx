import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiTrendingUp,
  FiDollarSign,
  FiFileText,
  FiPackage,
  FiPlus,
  FiArrowRight,
  FiDownload,
  FiRefreshCw,
  FiCalendar,
  FiBox,
  FiLayers,
  FiUsers,
  FiShoppingCart,
  FiBarChart2,
  FiX,
} from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import ProductKpiCards from './inventory/components/ProductKpiCards';
import { showToast } from '../utils/alert';

export default function Dashboard() {
  const navigate = useNavigate();
  const apiBase = import.meta.env.VITE_API_BASE_URL || '';

  const [isLoading, setIsLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('1W'); // 1D, 1W, 1M, 3M, 6M, 1Y
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [data, setData] = useState({
    hasCustomRange: false,
    kpi: {
      hasCustomRange: false,
      rangeSales: null,
      rangeBills: null,
      rangeQty: null,
      rangeAvgBillValue: null,
      rangeCustomers: null,
      todaySales: 0,
      todayBills: 0,
      todayQty: 0,
      salesGrowthPct: 0,
      totalSales: 0,
      totalInvoices: 0,
      totalQtySold: 0,
      avgBillValue: 0,
      totalProducts: 0,
      totalCategories: 0,
      totalCustomers: 0,
    },
    salesTrend: [],
    topProducts: [],
    categoryBreakdown: [],
    recentInvoices: [],
  });

  const [companyName, setCompanyName] = useState(() => {
    return localStorage.getItem('company_name') || 'AVS Crackers';
  });

  const [hoveredBar, setHoveredBar] = useState(null);

  // Fetch Dashboard Analytics with active period or date range filter
  const fetchDashboardData = async (
    period = selectedPeriod,
    sDate = startDate,
    eDate = endDate
  ) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ period });
      if (sDate) params.append('startDate', sDate);
      if (eDate) params.append('endDate', eDate);

      const res = await fetch(`${apiBase}/api/v1/dashboard/summary?${params.toString()}`, {
        credentials: 'include',
      });
      const json = await res.json();
      if (res.ok && json.success && json.data) {
        setData(json.data);
      } else {
        loadFallbackFromLocal(period, sDate, eDate);
      }
    } catch (err) {
      console.warn('Network issue fetching dashboard summary, using local cache:', err);
      loadFallbackFromLocal(period, sDate, eDate);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePeriodChange = (tab) => {
    if (startDate || endDate) {
      setStartDate('');
      setEndDate('');
    }
    setSelectedPeriod(tab);
    fetchDashboardData(tab, '', '');
  };

  const loadFallbackFromLocal = (period = '1W', sDate = startDate, eDate = endDate) => {
    try {
      const savedBills = JSON.parse(localStorage.getItem('rinvox_outward_bills') || '[]');
      const todayStr = new Date().toISOString().split('T')[0];
      const hasRange = Boolean(sDate || eDate);

      let tSales = 0;
      let tBills = 0;
      let tQty = 0;
      let rangeSales = 0;
      let rangeBills = 0;
      let rangeQty = 0;
      let grandSum = 0;
      let totalQtySum = 0;

      const uniqueMobiles = new Set();
      const filteredBills = [];

      savedBills.forEach((b) => {
        const amt = Number(b.grandTotal || 0);
        const q = Number(b.totalQty || b.items?.length || 1);
        grandSum += amt;
        totalQtySum += q;

        const mob = b.customerMobile || b.customer?.mobile;
        if (mob) uniqueMobiles.add(mob);

        const bDate = b.invoiceDate ? b.invoiceDate.split('T')[0] : '';
        if (bDate === todayStr) {
          tSales += amt;
          tBills += 1;
          tQty += q;
        }

        let inRange = true;
        if (sDate && bDate < sDate) inRange = false;
        if (eDate && bDate > eDate) inRange = false;

        if (inRange) {
          rangeSales += amt;
          rangeBills += 1;
          rangeQty += q;
          filteredBills.push(b);
        }
      });

      setData((prev) => ({
        ...prev,
        hasCustomRange: hasRange,
        kpi: {
          ...prev.kpi,
          hasCustomRange: hasRange,
          rangeSales: hasRange ? rangeSales : null,
          rangeBills: hasRange ? rangeBills : null,
          rangeQty: hasRange ? rangeQty : null,
          rangeAvgBillValue: hasRange && rangeBills > 0 ? rangeSales / rangeBills : 0,
          todaySales: tSales,
          todayBills: tBills,
          todayQty: tQty,
          totalSales: grandSum,
          totalInvoices: savedBills.length,
          totalQtySold: totalQtySum,
          avgBillValue: savedBills.length > 0 ? grandSum / savedBills.length : 0,
          totalCustomers: uniqueMobiles.size || savedBills.length,
        },
        recentInvoices: (hasRange ? filteredBills : savedBills).slice(0, 8),
      }));
    } catch (e) {
      console.warn('Fallback local error:', e);
    }
  };

  useEffect(() => {
    fetchDashboardData(selectedPeriod, startDate, endDate);
  }, [apiBase, startDate, endDate]);

  const { kpi, salesTrend, topProducts, categoryBreakdown, recentInvoices } = data;

  // Format dynamic period / custom date range label
  const periodLabel = useMemo(() => {
    if (startDate && endDate) {
      return `${startDate} to ${endDate}`;
    }
    if (startDate) {
      return `From ${startDate}`;
    }
    if (endDate) {
      return `Until ${endDate}`;
    }
    if (selectedPeriod === '1D') return 'Today (Last 24 Hours)';
    if (selectedPeriod === '1W') return 'Last 7 Days';
    if (selectedPeriod === '1M') return 'Last 30 Days';
    if (selectedPeriod === '3M') return 'Last 3 Months';
    if (selectedPeriod === '6M') return 'Last 6 Months';
    if (selectedPeriod === '1Y') return 'Last 12 Months';
    return 'Recent Outward Period';
  }, [selectedPeriod, startDate, endDate]);

  // WhatsApp share action
  const handleWhatsAppShare = (inv) => {
    const rawMobile = inv.customerMobile || '';
    const cleanMobile = rawMobile.replace(/\D/g, '');

    if (!cleanMobile || cleanMobile.length < 10) {
      showToast('Customer mobile number is not available', 'warning');
      return;
    }

    const custName = inv.customerName || 'Customer';
    const billNo = inv.invoiceNumber || 'Receipt';
    const amount = Number(inv.grandTotal || 0).toFixed(2);
    const pdfUrl = inv.pdfUrl || '';

    let messageText = `*${companyName} - Receipt Update*\n\nDear *${custName}*,\nThank you for choosing us! Your outward bill has been generated successfully.\n\n*Receipt No:* ${billNo}\n*Amount Payable:* ₹${amount}`;
    if (pdfUrl) {
      messageText += `\n\n*Download / View Receipt PDF:*\n${pdfUrl}`;
    }
    messageText += `\n\nFor any queries, please feel free to reach out. Have a great day!`;

    const encodedText = encodeURIComponent(messageText);
    const waUrl = `https://wa.me/91${cleanMobile.slice(-10)}?text=${encodedText}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  // Reusing ProductKpiCards with automatic count animation & DreamsPOS cards
  const dashboardKpiCards = useMemo(() => {
    const isRangeActive = Boolean(kpi.hasCustomRange || startDate || endDate);

    if (isRangeActive) {
      const rSales = kpi.rangeSales !== null && kpi.rangeSales !== undefined ? kpi.rangeSales : kpi.todaySales;
      const rBills = kpi.rangeBills !== null && kpi.rangeBills !== undefined ? kpi.rangeBills : kpi.todayBills;
      const rQty = kpi.rangeQty !== null && kpi.rangeQty !== undefined ? kpi.rangeQty : kpi.todayQty;
      const rAvg = kpi.rangeAvgBillValue !== null && kpi.rangeAvgBillValue !== undefined ? kpi.rangeAvgBillValue : kpi.avgBillValue;

      return [
        {
          title: 'Range Sales',
          value: `₹${Number(rSales || 0).toFixed(2)}`,
          subtext: 'Revenue for selected dates',
          icon: FiDollarSign,
          color: '#10B981',
          bgLight: 'bg-emerald-50',
          textColor: 'text-emerald-600',
          badge: 'Filtered',
          badgeType: 'success',
        },
        {
          title: 'Range Bills',
          value: `${rBills} Bills`,
          subtext: 'Receipts in selected dates',
          icon: FiFileText,
          color: '#FE9F43',
          bgLight: 'bg-[#FFF5EC]',
          textColor: 'text-[#FE9F43]',
          badge: 'Range',
          badgeType: 'primary',
        },
        {
          title: 'Crackers Outward',
          value: `${rQty} Units`,
          subtext: 'Units sold in selected dates',
          icon: FiPackage,
          color: '#6366F1',
          bgLight: 'bg-indigo-50',
          textColor: 'text-indigo-600',
          badge: 'Filtered',
          badgeType: 'info',
        },
        {
          title: 'Average Ticket Value',
          value: `₹${Number(rAvg || 0).toFixed(2)}`,
          subtext: 'Per customer spend in range',
          icon: FiTrendingUp,
          color: '#0D3B66',
          bgLight: 'bg-blue-50',
          textColor: 'text-[#0D3B66]',
          badge: 'Range Avg',
          badgeType: 'success',
        },
      ];
    }

    return [
      {
        title: "Today's Sales",
        value: `₹${Number(kpi.todaySales || 0).toFixed(2)}`,
        subtext: 'Revenue collected today',
        icon: FiDollarSign,
        color: '#10B981',
        bgLight: 'bg-emerald-50',
        textColor: 'text-emerald-600',
        badge: kpi.salesGrowthPct >= 0 ? `+${kpi.salesGrowthPct}%` : `${kpi.salesGrowthPct}%`,
        badgeType: kpi.salesGrowthPct >= 0 ? 'success' : 'danger',
      },
      {
        title: "Today's Bills",
        value: `${kpi.todayBills} Bills`,
        subtext: 'Receipts invoiced today',
        icon: FiFileText,
        color: '#FE9F43',
        bgLight: 'bg-[#FFF5EC]',
        textColor: 'text-[#FE9F43]',
        badge: 'Today',
        badgeType: 'primary',
      },
      {
        title: 'Crackers Outward',
        value: `${kpi.todayQty} Units`,
        subtext: 'Boxes / PCS outwarded',
        icon: FiPackage,
        color: '#6366F1',
        bgLight: 'bg-indigo-50',
        textColor: 'text-indigo-600',
        badge: '+6%',
        badgeType: 'info',
      },
      {
        title: 'Average Ticket Value',
        value: `₹${Number(kpi.avgBillValue || 0).toFixed(2)}`,
        subtext: 'Per customer spend',
        icon: FiTrendingUp,
        color: '#0D3B66',
        bgLight: 'bg-blue-50',
        textColor: 'text-[#0D3B66]',
        badge: 'Normal',
        badgeType: 'success',
      },
    ];
  }, [kpi, startDate, endDate]);

  // Max value for the Dual-bar Chart
  const maxBarSale = useMemo(() => {
    if (!salesTrend || salesTrend.length === 0) return 2000;
    const max = Math.max(...salesTrend.map((d) => d.sales));
    return max > 0 ? max * 1.25 : 2000;
  }, [salesTrend]);

  // Total sales in the currently filtered period
  const periodTotalSales = useMemo(() => {
    if (!salesTrend || salesTrend.length === 0) return 0;
    return salesTrend.reduce((sum, d) => sum + (Number(d.sales) || 0), 0);
  }, [salesTrend]);

  const periodTotalBills = useMemo(() => {
    if (!salesTrend || salesTrend.length === 0) return 0;
    return salesTrend.reduce((sum, d) => sum + (Number(d.bills) || 0), 0);
  }, [salesTrend]);

  // Colors for real category breakdown donut
  const categoryColors = ['#FE9F43', '#0D3B66', '#10B981', '#6366F1', '#EC4899', '#14B8A6'];

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12 font-['Nunito',sans-serif]">
      {/* 1. DreamsPOS Greeting Header (Mobile Responsive) */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[20px] sm:text-[22px]">👋</span>
            <h1 className="text-[20px] sm:text-[22px] font-extrabold text-[#212B36] tracking-tight">
              Hi Admin,{' '}
              <span className="text-[14px] sm:text-[16px] font-normal text-[#646B72]">
                {startDate || endDate
                  ? `showing sales report from ${periodLabel}.`
                  : `here's what's happening with ${companyName} today.`}
              </span>
            </h1>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          {/* Date Range Inputs */}
          <div className="flex items-center gap-1.5 sm:gap-2 bg-[#F8FAFC] border border-gray-200 rounded-xl px-2.5 py-1.5 text-[12px] sm:text-[12.5px] max-w-full overflow-x-auto shadow-2xs">
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
                title="Clear Date Range Filter"
                className="p-1 hover:bg-gray-200/70 rounded text-[#646B72] hover:text-red-600 transition-all cursor-pointer"
              >
                <FiX className="text-[12px]" />
              </button>
            )}
          </div>

          {/* Refresh Action */}
          <button
            type="button"
            onClick={() => fetchDashboardData(selectedPeriod, startDate, endDate)}
            title="Refresh Store Analytics"
            disabled={isLoading}
            className="p-2 sm:p-2.5 rounded-xl border border-gray-200 bg-white text-[#646B72] hover:text-[#0D3B66] hover:bg-gray-50 transition-all cursor-pointer shadow-2xs active:scale-95"
          >
            <FiRefreshCw className={`text-[14px] ${isLoading ? 'animate-spin text-[#0D3B66]' : ''}`} />
          </button>

          {/* Create Outward Bill Action */}
          <button
            type="button"
            onClick={() => navigate('/sales/outward')}
            className="px-3.5 sm:px-4 py-2 rounded-xl bg-gradient-to-r from-[#FE9F43] to-[#FF8412] hover:from-[#e88f37] hover:to-[#e67509] text-white text-[12.5px] sm:text-[13px] font-extrabold transition-all cursor-pointer shadow-md shadow-[#FE9F43]/25 flex items-center gap-1.5 active:scale-98"
          >
            <FiPlus className="text-[15px]" />
            <span>Create Bill</span>
          </button>
        </div>
      </div>

      {/* 2. Reused ProductKpiCards with Smooth Automatic Count Animation */}
      <ProductKpiCards cards={dashboardKpiCards} />

      {/* 3. Middle Section: Sales & Outward Analytics + Overall Info & Real Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Sales & Outward Dual-Tone Bar Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div>
            {/* Header: Title on Left, Filter Tabs on Right (1D, 1W, 1M, 3M, 6M, 1Y) */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-gray-50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#FFF5EC] text-[#FE9F43] flex items-center justify-center shrink-0">
                  <FiShoppingCart className="text-[16px]" />
                </div>
                <div>
                  <h3 className="text-[16px] sm:text-[17px] font-extrabold text-[#212B36] tracking-tight">
                    Sales & Outward
                  </h3>
                  <p className="text-[11.5px] text-[#646B72] font-medium hidden sm:block">
                    {startDate || endDate
                      ? `Custom range: ${periodLabel}`
                      : 'Filtered dynamically by selected timeframe'}
                  </p>
                </div>
              </div>

              {/* Functional Period Filter Tabs (1D, 1W, 1M, 3M, 6M, 1Y) */}
              <div className="flex items-center bg-[#F8FAFC] p-1 rounded-xl border border-gray-200 text-[11.5px] font-bold overflow-x-auto self-start sm:self-auto">
                {['1D', '1W', '1M', '3M', '6M', '1Y'].map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => handlePeriodChange(tab)}
                    className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                      selectedPeriod === tab && !startDate && !endDate
                        ? 'bg-[#FE9F43] text-white shadow-xs font-extrabold'
                        : 'text-[#646B72] hover:text-[#212B36]'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* Metric Summary Legend for the active period */}
            <div className="flex flex-wrap items-center gap-4 sm:gap-6 mt-4 mb-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#FE9F43]" />
                <span className="text-[12px] font-bold text-[#646B72]">
                  {startDate || endDate ? 'Selected Sales:' : 'Period Outward:'}
                </span>
                <span className="text-[15px] sm:text-[16px] font-extrabold text-[#212B36]">
                  ₹{Number(periodTotalSales).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#0D3B66]" />
                <span className="text-[12px] font-bold text-[#646B72]">
                  {startDate || endDate ? 'Selected Receipts:' : 'Period Receipts:'}
                </span>
                <span className="text-[15px] sm:text-[16px] font-extrabold text-[#212B36]">
                  {periodTotalBills}
                </span>
              </div>
            </div>

            {/* DreamsPOS Dual-Tone Bar Chart */}
            {salesTrend && salesTrend.length > 0 ? (
              <div className="h-60 sm:h-64 w-full relative pt-2">
                <svg className="w-full h-full overflow-visible" viewBox="0 0 580 180" preserveAspectRatio="none">
                  {/* Grid Lines */}
                  {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => (
                    <line
                      key={idx}
                      x1="0"
                      y1={150 - pct * 130}
                      x2="580"
                      y2={150 - pct * 130}
                      stroke="#F8FAFC"
                      strokeWidth="1.5"
                    />
                  ))}

                  {/* Dual-tone Stacked/Paired Bars */}
                  {salesTrend.map((item, idx) => {
                    const totalBars = salesTrend.length;
                    const barWidth = Math.min(28, (500 / totalBars) * 0.65);
                    const gap = 540 / totalBars;
                    const x = 20 + idx * gap + (gap - barWidth) / 2;

                    const fullHeight = 130;
                    const backdropY = 150 - fullHeight;

                    const activeHeight = Math.max(8, (item.sales / maxBarSale) * 130);
                    const activeY = 150 - activeHeight;

                    const isHovered = hoveredBar?.date === item.date;

                    return (
                      <g key={idx} className="cursor-pointer">
                        {/* Light Peach Backdrop Bar */}
                        <rect
                          x={x}
                          y={backdropY}
                          width={barWidth}
                          height={fullHeight}
                          fill="#FFE7D0"
                          opacity="0.65"
                          rx="6"
                          onMouseEnter={() => setHoveredBar(item)}
                          onMouseLeave={() => setHoveredBar(null)}
                        />

                        {/* Solid Orange Active Bar */}
                        <rect
                          x={x}
                          y={activeY}
                          width={barWidth}
                          height={activeHeight}
                          fill={isHovered ? '#0D3B66' : '#FE9F43'}
                          rx="6"
                          className="transition-all duration-300"
                          onMouseEnter={() => setHoveredBar(item)}
                          onMouseLeave={() => setHoveredBar(null)}
                        />

                        {/* Label */}
                        <text
                          x={x + barWidth / 2}
                          y="170"
                          textAnchor="middle"
                          fontSize="10"
                          fontWeight={isHovered ? 'bold' : '600'}
                          fill={isHovered ? '#0D3B66' : '#646B72'}
                        >
                          {item.label}
                        </text>
                      </g>
                    );
                  })}
                </svg>

                {/* Hover Tooltip */}
                {hoveredBar && (
                  <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-[#212B36] text-white px-3 py-1.5 rounded-xl shadow-xl text-[12px] pointer-events-none flex items-center gap-2.5 animate-in fade-in duration-150 z-20">
                    <span className="font-bold text-[#FE9F43]">{hoveredBar.label}:</span>
                    <span className="font-extrabold">₹{Number(hoveredBar.sales).toFixed(2)}</span>
                    <span className="text-gray-300">({hoveredBar.bills} bills)</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-60 sm:h-64 flex flex-col items-center justify-center text-center text-[#646B72]">
                <FiBarChart2 className="text-[32px] text-gray-300 mb-2" />
                <p className="text-[13px] font-bold">No sales records in selected period ({selectedPeriod})</p>
                <p className="text-[11.5px] text-gray-400 mt-0.5">Click 1W or 1M to view overall trend</p>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-[11.5px] font-semibold text-[#646B72]">
            <span>Filter: {selectedPeriod} view</span>
            <span
              className="text-[#0D3B66] font-bold cursor-pointer hover:underline"
              onClick={() => navigate('/sales/outward-list')}
            >
              View Detailed Analytics →
            </span>
          </div>
        </div>

        {/* Right Column (1 Col): Overall Information SHORTCUTS + Real Category Breakdown */}
        <div className="space-y-6">
          {/* Overall Information FUNCTIONAL SHORTCUTS (DreamsPOS Style) */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3.5">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-[12px] font-bold">
                  ℹ
                </span>
                <h3 className="text-[15px] font-extrabold text-[#212B36] tracking-tight">
                  Overall Information
                </h3>
              </div>
              <span className="text-[11px] font-semibold text-[#94A3B8]">Click to open</span>
            </div>

            {/* 3 Clickable Functional Shortcut Cards */}
            <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
              {/* Customers shortcut -> Outward List */}
              <button
                type="button"
                onClick={() => navigate('/sales/outward-list')}
                title="Click to view Customer Billing Records"
                className="bg-[#F8FAFC] border border-gray-100 rounded-xl p-3 text-center hover:border-[#FE9F43] hover:bg-orange-50/40 hover:shadow-sm transition-all duration-200 cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-lg bg-orange-50 text-[#FE9F43] flex items-center justify-center mx-auto mb-1.5 group-hover:scale-110 transition-transform">
                  <FiUsers className="text-[16px]" />
                </div>
                <span className="text-[11px] font-bold text-[#646B72] block group-hover:text-[#FE9F43]">
                  Customers
                </span>
                <span className="text-[17px] font-extrabold text-[#212B36] block mt-0.5">
                  {kpi.totalCustomers || kpi.totalInvoices || 0}
                </span>
                <span className="text-[9.5px] text-[#94A3B8] font-bold mt-0.5 block group-hover:text-[#FE9F43]">
                  View List →
                </span>
              </button>

              {/* Products shortcut -> All Products */}
              <button
                type="button"
                onClick={() => navigate('/inventory/products')}
                title="Click to manage Inventory Products"
                className="bg-[#F8FAFC] border border-gray-100 rounded-xl p-3 text-center hover:border-blue-400 hover:bg-blue-50/40 hover:shadow-sm transition-all duration-200 cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-1.5 group-hover:scale-110 transition-transform">
                  <FiBox className="text-[16px]" />
                </div>
                <span className="text-[11px] font-bold text-[#646B72] block group-hover:text-blue-600">
                  Products
                </span>
                <span className="text-[17px] font-extrabold text-[#212B36] block mt-0.5">
                  {kpi.totalProducts || 0}
                </span>
                <span className="text-[9.5px] text-[#94A3B8] font-bold mt-0.5 block group-hover:text-blue-600">
                  Inventory →
                </span>
              </button>

              {/* Outward Bills shortcut -> Outward List */}
              <button
                type="button"
                onClick={() => navigate('/sales/outward-list')}
                title="Click to view all Outward Receipts"
                className="bg-[#F8FAFC] border border-gray-100 rounded-xl p-3 text-center hover:border-emerald-500 hover:bg-emerald-50/40 hover:shadow-sm transition-all duration-200 cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-1.5 group-hover:scale-110 transition-transform">
                  <FiShoppingCart className="text-[16px]" />
                </div>
                <span className="text-[11px] font-bold text-[#646B72] block group-hover:text-emerald-600">
                  Outward
                </span>
                <span className="text-[17px] font-extrabold text-[#212B36] block mt-0.5">
                  {kpi.totalInvoices || 0}
                </span>
                <span className="text-[9.5px] text-[#94A3B8] font-bold mt-0.5 block group-hover:text-emerald-600">
                  All Bills →
                </span>
              </button>
            </div>
          </div>

          {/* Real Category Share Donut & Breakdown (100% Real Data) */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[15px] font-extrabold text-[#212B36] tracking-tight">
                Category Sales Share
              </h3>
              <button
                type="button"
                onClick={() => navigate('/inventory/category')}
                className="text-[11px] font-bold text-[#FE9F43] hover:underline"
              >
                Manage
              </button>
            </div>

            {categoryBreakdown && categoryBreakdown.length > 0 ? (
              <div className="space-y-3 pt-1">
                {categoryBreakdown.slice(0, 4).map((cat, idx) => {
                  const barColor = categoryColors[idx % categoryColors.length];
                  return (
                    <div key={idx} className="group">
                      <div className="flex items-center justify-between text-[12px] mb-1">
                        <span className="font-extrabold text-[#212B36] truncate max-w-[150px]">
                          {cat.category}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-extrabold text-[#0D3B66]">
                            ₹{Number(cat.amount).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                          </span>
                          <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded bg-gray-100 text-[#212B36]">
                            {cat.percentage}%
                          </span>
                        </div>
                      </div>
                      <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${cat.percentage}%`,
                            backgroundColor: barColor,
                          }}
                        />
                      </div>
                      <span className="text-[10.5px] text-[#646B72] font-semibold mt-0.5 block text-right">
                        {cat.qty} Units Sold
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-8 text-center text-[#646B72] text-[12px]">
                <FiLayers className="text-[24px] mx-auto text-gray-300 mb-1" />
                <span>No category sales registered yet</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4. Bottom Section: 2 REAL-DATA TABLES (Top Selling Products + Recent Outward Invoices) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Table 1: Top Selling Crackers (Fast-Moving) */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-pink-50 text-pink-500 flex items-center justify-center shrink-0">
                  <FiTrendingUp className="text-[16px]" />
                </div>
                <div>
                  <h3 className="text-[16px] font-extrabold text-[#212B36] tracking-tight">
                    Top Selling Crackers
                  </h3>
                  <p className="text-[11.5px] text-[#646B72] font-medium hidden sm:block">
                    Real sales ranking based on invoiced orders
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => navigate('/inventory/products')}
                className="text-[12px] font-bold text-[#0D3B66] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>All Products</span>
                <FiArrowRight className="text-[11px]" />
              </button>
            </div>

            {/* Top Products Real Table */}
            {topProducts && topProducts.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-100 text-[11px] font-bold text-[#646B72] uppercase tracking-wider bg-gray-50/70">
                      <th className="py-2.5 px-3 w-8 text-center">#</th>
                      <th className="py-2.5 px-3">Product Name</th>
                      <th className="py-2.5 px-3">Category</th>
                      <th className="py-2.5 px-3 text-center">Qty</th>
                      <th className="py-2.5 px-3 text-right">Revenue (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-[12.5px]">
                    {topProducts.map((p, idx) => (
                      <tr key={idx} className="hover:bg-gray-50/80 transition-colors">
                        <td className="py-2.5 px-3 text-center font-bold text-[#646B72]">
                          {idx + 1}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-[#212B36] whitespace-nowrap">
                          <span className="mr-1.5">💥</span>
                          {p.name}
                        </td>
                        <td className="py-2.5 px-3 text-[#646B72] whitespace-nowrap font-medium">
                          <span className="bg-gray-100 px-2 py-0.5 rounded text-[11px]">
                            {p.category}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center font-extrabold text-[#212B36]">
                          {p.qty}
                        </td>
                        <td className="py-2.5 px-3 text-right font-extrabold text-[#0D3B66] whitespace-nowrap">
                          ₹{Number(p.revenue).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-12 text-center text-[#646B72] text-[13px] font-medium">
                No outward product sales recorded yet.
              </div>
            )}
          </div>
        </div>

        {/* Table 2: Recent Outward Invoices */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <FiFileText className="text-[16px]" />
                </div>
                <div>
                  <h3 className="text-[16px] font-extrabold text-[#212B36] tracking-tight">
                    Recent Outward Invoices
                  </h3>
                  <p className="text-[11.5px] text-[#646B72] font-medium hidden sm:block">
                    Latest customer bills with quick actions
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => navigate('/sales/outward-list')}
                className="text-[12px] font-bold text-[#0D3B66] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>View All</span>
                <FiArrowRight className="text-[11px]" />
              </button>
            </div>

            {/* Recent Invoices Real Table */}
            {recentInvoices && recentInvoices.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-100 text-[11px] font-bold text-[#646B72] uppercase tracking-wider bg-gray-50/70">
                      <th className="py-2.5 px-3">Receipt No</th>
                      <th className="py-2.5 px-3">Customer</th>
                      <th className="py-2.5 px-3 text-right">Amount</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                      <th className="py-2.5 px-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-[12.5px]">
                    {recentInvoices.map((inv, idx) => (
                      <tr key={idx} className="hover:bg-gray-50/80 transition-colors">
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => {
                              if (inv.pdfUrl) window.open(inv.pdfUrl, '_blank', 'noopener,noreferrer');
                              else showToast('Receipt PDF not available yet', 'warning');
                            }}
                            title="Click to view/download receipt PDF"
                            className="font-extrabold text-[#0D3B66] hover:underline cursor-pointer text-left block"
                          >
                            {inv.invoiceNumber}
                          </button>
                        </td>

                        <td className="py-2.5 px-3 font-semibold text-[#212B36] whitespace-nowrap">
                          {inv.customerName || 'Customer'}
                        </td>

                        <td className="py-2.5 px-3 text-right font-extrabold text-[#212B36] whitespace-nowrap">
                          ₹{Number(inv.grandTotal || 0).toFixed(2)}
                        </td>

                        <td className="py-2.5 px-3 text-center whitespace-nowrap">
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">
                            ● Completed
                          </span>
                        </td>

                        <td className="py-2.5 px-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {/* WhatsApp Share */}
                            <button
                              type="button"
                              onClick={() => handleWhatsAppShare(inv)}
                              title="Share on WhatsApp"
                              className="p-1 rounded-md bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white transition-all cursor-pointer shadow-2xs"
                            >
                              <FaWhatsapp className="text-[12px]" />
                            </button>

                            {/* Download PDF */}
                            <button
                              type="button"
                              onClick={() => {
                                if (inv.pdfUrl) window.open(inv.pdfUrl, '_blank', 'noopener,noreferrer');
                                else showToast('Receipt PDF not available yet', 'warning');
                              }}
                              title="Download PDF"
                              className="p-1 rounded-md bg-blue-50 text-blue-600 hover:bg-[#0D3B66] hover:text-white transition-all cursor-pointer shadow-2xs"
                            >
                              <FiDownload className="text-[12px]" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-12 text-center text-[#646B72] text-[13px] font-medium">
                No recent outward invoices found.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
