import React from 'react';

export default function Input({
  id,
  name,
  type = 'text',
  label,
  value,
  onChange,
  placeholder,
  disabled = false,
  required = false,
  leftIcon: LeftIcon,
  rightIcon,
  error,
  helperText,
  className = '',
  ...props
}) {
  return (
    <div className="w-full flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={id}
          className="text-[13px] font-semibold text-[#212B36] flex items-center justify-between"
        >
          <span>
            {label} {required && <span className="text-red-500">*</span>}
          </span>
        </label>
      )}

      <div className="relative w-full">
        {LeftIcon && (
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#646B72]">
            {typeof LeftIcon === 'function' ? (
              <LeftIcon className="text-[18px]" />
            ) : (
              LeftIcon
            )}
          </div>
        )}

        <input
          id={id}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className={`w-full py-2.5 px-3.5 bg-[#F7F7F7] border rounded-lg text-[13.5px] font-medium text-[#212B36] placeholder-[#646B72]/60 transition-all duration-200 outline-none
            ${LeftIcon ? 'pl-10' : 'pl-3.5'}
            ${rightIcon ? 'pr-10' : 'pr-3.5'}
            ${
              error
                ? 'border-red-400 focus:border-red-500 focus:ring-4 focus:ring-red-100'
                : 'border-gray-100 hover:border-gray-200 focus:border-[#FE9F43] focus:bg-white focus:ring-3 focus:ring-[#FE9F43]/15'
            }
            ${disabled ? 'opacity-60 cursor-not-allowed bg-gray-100' : ''}
            ${className}
          `}
          {...props}
        />

        {rightIcon && (
          <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
            {rightIcon}
          </div>
        )}
      </div>

      {(error || helperText) && (
        <p
          className={`text-[12px] font-medium ${
            error ? 'text-red-500' : 'text-[#646B72]'
          }`}
        >
          {error || helperText}
        </p>
      )}
    </div>
  );
}
