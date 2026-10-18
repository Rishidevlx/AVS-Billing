import React from 'react';
import { FiSearch } from 'react-icons/fi';

export default function SearchInput({
  value = '',
  onChange,
  onClear,
  placeholder = 'Search...',
  className = '',
  ...props
}) {
  return (
    <div className={`relative w-full ${className}`}>
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#646B72]">
        <FiSearch className="text-[14px]" />
      </div>

      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full pl-8.5 pr-8 py-2 bg-white border border-gray-200 rounded-lg text-[13px] font-medium text-[#212B36] placeholder-[#646B72]/60 focus:border-[#FE9F43] focus:ring-2 focus:ring-[#FE9F43]/15 outline-none transition-all shadow-xs"
        {...props}
      />

      {value && (
        <button
          type="button"
          onClick={onClear}
          title="Clear search"
          className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-[12px] text-[#646B72] hover:text-[#212B36] cursor-pointer"
        >
          ✕
        </button>
      )}
    </div>
  );
}
