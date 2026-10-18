import React, { useState, useRef, useEffect } from 'react';
import { FiChevronDown, FiSearch, FiCheck, FiX } from 'react-icons/fi';

export default function SearchableSelect({
  id,
  value,
  onChange,
  options = [],
  placeholder = 'Select option...',
  disabled = false,
  error,
  className = '',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto-focus search input when opening
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  // Selected option label
  const selectedOption = options.find((opt) => {
    const optVal = typeof opt === 'object' ? opt.value : opt;
    return optVal === value;
  });

  const displayLabel = selectedOption
    ? typeof selectedOption === 'object'
      ? selectedOption.label
      : selectedOption
    : '';

  // Filter options based on search term
  const filteredOptions = options.filter((opt) => {
    const label = typeof opt === 'object' ? opt.label : String(opt);
    const sublabel = typeof opt === 'object' && opt.sublabel ? String(opt.sublabel) : '';
    const q = searchTerm.toLowerCase().trim();
    if (!q) return true;
    return label.toLowerCase().includes(q) || sublabel.toLowerCase().includes(q);
  });

  const handleSelect = (opt) => {
    const optVal = typeof opt === 'object' ? opt.value : opt;
    onChange(optVal, opt);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange('', null);
    setSearchTerm('');
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        id={id}
        disabled={disabled}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        className={`w-full py-2.5 px-3.5 bg-white border rounded-lg text-left text-[13.5px] font-medium transition-all flex items-center justify-between cursor-pointer outline-none shadow-2xs
          ${
            error
              ? 'border-red-400 focus:ring-2 focus:ring-red-100'
              : isOpen
              ? 'border-[#FE9F43] ring-2 ring-[#FE9F43]/15'
              : 'border-gray-200 hover:border-gray-300'
          }
          ${disabled ? 'opacity-60 cursor-not-allowed bg-gray-100' : ''}
        `}
      >
        <span
          className={`truncate ${
            displayLabel ? 'text-[#212B36] font-semibold' : 'text-[#646B72]/60'
          }`}
        >
          {displayLabel || placeholder}
        </span>

        <div className="flex items-center gap-1.5 ml-2 shrink-0">
          {displayLabel && !disabled && (
            <span
              onClick={handleClear}
              title="Clear selection"
              className="p-0.5 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 cursor-pointer"
            >
              <FiX className="text-[13px]" />
            </span>
          )}
          <FiChevronDown
            className={`text-[15px] text-[#646B72] transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-[#FE9F43]' : ''
            }`}
          />
        </div>
      </button>

      {/* Floating Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100 min-w-[220px]">
          {/* Search Header */}
          <div className="p-2 border-b border-gray-100 bg-[#F8FAFC]">
            <div className="relative">
              <FiSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[13px] text-[#646B72]" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Type to search..."
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-gray-200 rounded-lg text-[12.5px] font-medium text-[#212B36] placeholder-[#646B72]/60 focus:border-[#FE9F43] focus:ring-2 focus:ring-[#FE9F43]/15 outline-none"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[12px] text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Options List */}
          <div className="max-h-56 overflow-y-auto p-1 divide-y divide-gray-50">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt, idx) => {
                const optVal = typeof opt === 'object' ? opt.value : opt;
                const optLabel = typeof opt === 'object' ? opt.label : opt;
                const optSub = typeof opt === 'object' ? opt.sublabel : null;
                const isSelected = optVal === value;

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelect(opt)}
                    className={`w-full px-3 py-2 text-left rounded-lg text-[13px] transition-all flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-[#FFF5EC] text-[#FE9F43] font-bold'
                        : 'text-[#212B36] hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex flex-col truncate pr-2">
                      <span className="truncate">{optLabel}</span>
                      {optSub && (
                        <span className="text-[11px] font-medium text-[#646B72] truncate">
                          {optSub}
                        </span>
                      )}
                    </div>

                    {isSelected && (
                      <FiCheck className="text-[14px] text-[#FE9F43] shrink-0" />
                    )}
                  </button>
                );
              })
            ) : (
              <div className="py-6 text-center text-[12.5px] text-[#646B72]">
                No options matching "{searchTerm}"
              </div>
            )}
          </div>
        </div>
      )}

      {error && <p className="text-[11.5px] font-medium text-red-500 mt-1">{error}</p>}
    </div>
  );
}
