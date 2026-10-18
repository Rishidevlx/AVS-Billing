import React from 'react';

export default function Badge({
  children,
  variant = 'outline', // 'outline' | 'soft' | 'solid'
  color = 'success', // 'success' | 'danger' | 'warning' | 'primary' | 'secondary' | 'info'
  className = '',
}) {
  // Outline Badge styles matching Velzon / modern ERP reference
  const outlineStyles = {
    success: 'border border-emerald-500 text-emerald-600 bg-transparent',
    danger: 'border border-rose-500 text-rose-600 bg-transparent',
    warning: 'border border-amber-500 text-amber-600 bg-transparent',
    primary: 'border border-[#FE9F43] text-[#FE9F43] bg-transparent',
    secondary: 'border border-[#646B72] text-[#646B72] bg-transparent',
    info: 'border border-sky-500 text-sky-600 bg-transparent',
  };

  const softStyles = {
    success: 'bg-emerald-50 text-emerald-600 border border-emerald-100',
    danger: 'bg-rose-50 text-rose-600 border border-rose-100',
    warning: 'bg-amber-50 text-amber-600 border border-amber-100',
    primary: 'bg-[#FFF5EC] text-[#FE9F43] border border-[#FFE7D3]',
    secondary: 'bg-gray-100 text-[#646B72] border border-gray-200',
    info: 'bg-sky-50 text-sky-600 border border-sky-100',
  };

  const solidStyles = {
    success: 'bg-emerald-500 text-white',
    danger: 'bg-rose-500 text-white',
    warning: 'bg-amber-500 text-white',
    primary: 'bg-[#FE9F43] text-white',
    secondary: 'bg-[#646B72] text-white',
    info: 'bg-sky-500 text-white',
  };

  const styleMap = {
    outline: outlineStyles,
    soft: softStyles,
    solid: solidStyles,
  };

  const selectedStyle =
    styleMap[variant]?.[color] || outlineStyles[color] || outlineStyles.success;

  return (
    <span
      className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-md text-[11.5px] font-bold tracking-wide select-none ${selectedStyle} ${className}`}
    >
      {children}
    </span>
  );
}
