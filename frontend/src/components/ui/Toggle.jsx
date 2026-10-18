import React from 'react';

export default function Toggle({
  id,
  name,
  label,
  checked = true,
  onChange,
  disabled = false,
  description,
  activeLabel = 'Active',
  inactiveLabel = 'Inactive',
  className = '',
}) {
  return (
    <div className={`flex items-center justify-between gap-4 ${className}`}>
      {label && (
        <div className="flex flex-col">
          <label htmlFor={id} className="text-[12.5px] font-semibold text-[#212B36] cursor-pointer">
            {label}
          </label>
          {description && (
            <span className="text-[11.5px] font-medium text-[#646B72]">{description}</span>
          )}
        </div>
      )}

      <div className="flex items-center gap-2.5">
        <button
          type="button"
          id={id}
          name={name}
          role="switch"
          aria-checked={checked}
          disabled={disabled}
          onClick={() => !disabled && onChange && onChange(!checked)}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none focus-visible:ring-2 focus-visible:ring-[#FE9F43]/30
            ${checked ? 'bg-[#FE9F43]' : 'bg-gray-200'}
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          <span
            aria-hidden="true"
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out
              ${checked ? 'translate-x-5' : 'translate-x-0'}
            `}
          />
        </button>

        <span
          className={`text-[12px] font-bold px-2 py-0.5 rounded-md ${
            checked
              ? 'bg-[#FFF5EC] text-[#FE9F43] border border-[#FFE7D3]'
              : 'bg-gray-100 text-[#646B72]'
          }`}
        >
          {checked ? activeLabel : inactiveLabel}
        </span>
      </div>
    </div>
  );
}
