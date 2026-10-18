import React from 'react';
import { FiCheck } from 'react-icons/fi';

export default function Checkbox({
  id,
  name,
  checked,
  onChange,
  label,
  disabled = false,
  variant = 'primary', // 'primary' | 'secondary' | 'success' | 'danger' | 'dark'
  className = '',
}) {
  // Outline style color variants matching Velzon / modern outline checkbox specs
  const variantStyles = {
    primary: {
      checkedBorder: 'border-[#FE9F43]',
      iconColor: 'text-[#FE9F43]',
      ring: 'focus-visible:ring-[#FE9F43]/30',
    },
    secondary: {
      checkedBorder: 'border-blue-500',
      iconColor: 'text-blue-500',
      ring: 'focus-visible:ring-blue-500/30',
    },
    success: {
      checkedBorder: 'border-emerald-500',
      iconColor: 'text-emerald-500',
      ring: 'focus-visible:ring-emerald-500/30',
    },
    danger: {
      checkedBorder: 'border-rose-500',
      iconColor: 'text-rose-500',
      ring: 'focus-visible:ring-rose-500/30',
    },
    dark: {
      checkedBorder: 'border-[#212B36]',
      iconColor: 'text-[#212B36]',
      ring: 'focus-visible:ring-[#212B36]/30',
    },
  };

  const currentVariant = variantStyles[variant] || variantStyles.primary;

  return (
    <label
      htmlFor={id}
      className={`inline-flex items-center gap-2.5 cursor-pointer select-none group ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      } ${className}`}
    >
      <div className="relative flex items-center justify-center">
        {/* Real hidden input for accessibility */}
        <input
          id={id}
          name={name}
          type="checkbox"
          checked={checked}
          onChange={onChange}
          disabled={disabled}
          className="sr-only peer"
        />

        {/* Custom Outline Checkbox Box */}
        <div
          className={`w-[19px] h-[19px] rounded-md border-2 bg-white flex items-center justify-center transition-all duration-200 peer-focus-visible:ring-4 ${
            currentVariant.ring
          } ${
            checked
              ? `${currentVariant.checkedBorder} shadow-sm`
              : 'border-gray-300 group-hover:border-gray-400'
          }`}
        >
          <FiCheck
            className={`text-[14px] stroke-[3] transition-all duration-150 ${
              currentVariant.iconColor
            } ${
              checked
                ? 'opacity-100 scale-100'
                : 'opacity-0 scale-75 pointer-events-none'
            }`}
          />
        </div>
      </div>

      {label && (
        <span className="text-[13px] font-medium text-[#646B72] group-hover:text-[#212B36] transition-colors">
          {label}
        </span>
      )}
    </label>
  );
}
