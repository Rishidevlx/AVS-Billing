import React from 'react';
import { FiChevronDown } from 'react-icons/fi';

export default function Select({
  id,
  name,
  label,
  value,
  onChange,
  options = [],
  placeholder = 'Select an option',
  disabled = false,
  required = false,
  error,
  helperText,
  className = '',
  ...props
}) {
  return (
    <div className="w-full flex flex-col gap-1">
      {label && (
        <label
          htmlFor={id}
          className="text-[12.5px] font-semibold text-[#212B36] flex items-center justify-between"
        >
          <span>
            {label} {required && <span className="text-red-500">*</span>}
          </span>
        </label>
      )}

      <div className="relative w-full">
        <select
          id={id}
          name={name}
          value={value}
          onChange={onChange}
          disabled={disabled}
          required={required}
          className={`w-full py-2.5 pl-3.5 pr-10 bg-[#F7F7F7] border rounded-lg text-[13.5px] font-medium text-[#212B36] appearance-none cursor-pointer outline-none transition-all duration-200
            ${
              error
                ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100'
                : 'border-gray-100 hover:border-gray-200 focus:border-[#FE9F43] focus:bg-white focus:ring-2 focus:ring-[#FE9F43]/15'
            }
            ${disabled ? 'opacity-60 cursor-not-allowed bg-gray-100' : ''}
            ${className}
          `}
          {...props}
        >
          {placeholder && (
            <option value="" disabled className="text-[#646B72]/60">
              {placeholder}
            </option>
          )}

          {options.map((opt, idx) => {
            const val = typeof opt === 'object' ? opt.value : opt;
            const text = typeof opt === 'object' ? opt.label : opt;
            return (
              <option key={idx} value={val} className="text-[#212B36]">
                {text}
              </option>
            );
          })}
        </select>

        <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-[#646B72]">
          <FiChevronDown className="text-[15px]" />
        </div>
      </div>

      {(error || helperText) && (
        <p className={`text-[11.5px] font-medium ${error ? 'text-red-500' : 'text-[#646B72]'}`}>
          {error || helperText}
        </p>
      )}
    </div>
  );
}
