import React from 'react';
import { FiFileText, FiDollarSign, FiBox, FiTrendingUp } from 'react-icons/fi';

export default function OutwardKpiCards({ stats = {} }) {
  const {
    totalInvoices = 0,
    totalSales = 0,
    totalQtySold = 0,
    avgBillValue = 0,
  } = stats;

  const cards = [
    {
      title: 'Total Invoices',
      value: totalInvoices,
      subtext: 'Generated outward bills',
      icon: FiFileText,
      bgLight: 'bg-[#FFF5EC]',
      textColor: 'text-[#FE9F43]',
    },
    {
      title: 'Total Sales',
      value: `₹${Number(totalSales || 0).toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
      subtext: 'Total revenue collected',
      icon: FiDollarSign,
      bgLight: 'bg-emerald-50',
      textColor: 'text-emerald-600',
    },
    {
      title: 'Total Quantity Sold',
      value: totalQtySold,
      subtext: 'Units & boxes invoiced',
      icon: FiBox,
      bgLight: 'bg-indigo-50',
      textColor: 'text-indigo-600',
    },
    {
      title: 'Average Bill Value',
      value: `₹${Number(avgBillValue || 0).toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
      subtext: 'Average ticket size',
      icon: FiTrendingUp,
      bgLight: 'bg-blue-50',
      textColor: 'text-blue-600',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className="bg-white rounded-xl border border-gray-100 p-4.5 shadow-xs hover:border-gray-200 hover:shadow-sm transition-all duration-200"
          >
            <div className="flex items-center justify-between">
              <span className="text-[12.5px] font-semibold text-[#646B72]">
                {card.title}
              </span>
              <div
                className={`w-9 h-9 rounded-lg ${card.bgLight} ${card.textColor} flex items-center justify-center`}
              >
                <Icon className="text-[18px]" />
              </div>
            </div>

            <div className="mt-3">
              <h3 className="text-[22px] font-extrabold text-[#212B36] tracking-tight">
                {card.value}
              </h3>
              <p className="text-[11.5px] font-medium text-[#646B72] mt-0.5">
                {card.subtext}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

