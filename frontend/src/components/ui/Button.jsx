import React from 'react';
import { FiLoader } from 'react-icons/fi';

export default function Button({
  type = 'button',
  variant = 'primary', // 'primary' | 'cancel' | 'secondary' | 'outline' | 'ghost'
  size = 'md', // 'sm' | 'md' | 'lg'
  fullWidth = false,
  loading = false,
  disabled = false,
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  children,
  className = '',
  onClick,
  ...props
}) {
  const baseStyles =
    'inline-flex items-center justify-center font-bold transition-all duration-150 select-none cursor-pointer outline-none focus-visible:ring-3';

  // Crisp, modern rounded-lg matching SweetAlert popups
  const sizeStyles = {
    sm: 'text-[12.5px] py-1.5 px-3 rounded-lg gap-1.5',
    md: 'text-[13.5px] py-2.5 px-4.5 rounded-lg gap-2',
    lg: 'text-[14.5px] py-3 px-5.5 rounded-lg gap-2.5',
  };

  const variantStyles = {
    primary:
      'bg-[#FE9F43] hover:bg-[#ea8f35] active:scale-[0.99] text-[#FFFFFF] shadow-sm shadow-[#FE9F43]/25 focus-visible:ring-[#FE9F43]/30',
    cancel:
      'bg-[#646B72] hover:bg-[#52585e] active:scale-[0.99] text-[#FFFFFF] shadow-sm focus-visible:ring-[#646B72]/30',
    secondary:
      'bg-[#212B36] hover:bg-[#182029] active:scale-[0.99] text-white shadow-sm focus-visible:ring-gray-400/30',
    outline:
      'bg-transparent border border-[#FE9F43] text-[#FE9F43] hover:bg-[#FE9F43]/10 active:scale-[0.99] focus-visible:ring-[#FE9F43]/20',
    ghost:
      'bg-transparent hover:bg-gray-100 text-[#646B72] hover:text-[#212B36] active:scale-[0.99]',
  };

  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      disabled={isDisabled}
      onClick={onClick}
      className={`
        ${baseStyles}
        ${sizeStyles[size] || sizeStyles.md}
        ${variantStyles[variant] || variantStyles.primary}
        ${fullWidth ? 'w-full' : ''}
        ${isDisabled ? 'opacity-65 cursor-not-allowed active:scale-100 shadow-none' : ''}
        ${className}
      `}
      {...props}
    >
      {loading ? (
        <FiLoader className="animate-spin text-[17px]" />
      ) : (
        LeftIcon && (
          typeof LeftIcon === 'function' ? (
            <LeftIcon className="text-[17px]" />
          ) : (
            LeftIcon
          )
        )
      )}

      <span>{children}</span>

      {!loading && RightIcon && (
        typeof RightIcon === 'function' ? (
          <RightIcon className="text-[17px]" />
        ) : (
          RightIcon
        )
      )}
    </button>
  );
}
