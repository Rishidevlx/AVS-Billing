import React, { useState, useRef, useEffect } from 'react';
import { FiChevronDown, FiCheck, FiX } from 'react-icons/fi';

export default function Combobox({
  id,
  value = '',
  onChange,
  options = [],
  placeholder = 'Type or select...',
  disabled = false,
  hasError = false,
  className = '',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const optionsListRef = useRef(null);

  // Sync input text with selected value
  useEffect(() => {
    const selected = options.find((opt) => {
      const optVal = typeof opt === 'object' ? opt.value : opt;
      return optVal === value;
    });

    if (selected) {
      const label = typeof selected === 'object' ? selected.label : String(selected);
      setInputText(label);
    } else {
      setInputText(value || '');
    }
  }, [value, options]);

  // Filter options based on input text while typing
  const filteredOptions = options.filter((opt) => {
    const label = typeof opt === 'object' ? opt.label : String(opt);
    const sublabel = typeof opt === 'object' && opt.sublabel ? String(opt.sublabel) : '';
    const q = inputText.toLowerCase().trim();
    if (!q) return true;
    return label.toLowerCase().includes(q) || sublabel.toLowerCase().includes(q);
  });

  // Reset highlighted index when filtered options change
  useEffect(() => {
    setHighlightedIndex(0);
  }, [filteredOptions.length]);

  // Scroll highlighted option into view
  useEffect(() => {
    if (isOpen && optionsListRef.current) {
      const highlightedEl = optionsListRef.current.children[highlightedIndex];
      if (highlightedEl) {
        highlightedEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex, isOpen]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
        const matched = options.find((opt) => {
          const optVal = typeof opt === 'object' ? opt.value : opt;
          const optLabel = typeof opt === 'object' ? opt.label : String(opt);
          return (
            optVal.toLowerCase() === inputText.trim().toLowerCase() ||
            optLabel.toLowerCase() === inputText.trim().toLowerCase()
          );
        });

        if (matched) {
          const matchedVal = typeof matched === 'object' ? matched.value : matched;
          const matchedLabel = typeof matched === 'object' ? matched.label : String(matched);
          setInputText(matchedLabel);
          onChange(matchedVal, matched);
        } else if (!value) {
          setInputText('');
        } else {
          const current = options.find((opt) => {
            const optVal = typeof opt === 'object' ? opt.value : opt;
            return optVal === value;
          });
          setInputText(current ? (typeof current === 'object' ? current.label : current) : '');
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [value, options, inputText, onChange]);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setInputText(val);
    setIsOpen(true);
    if (!val.trim()) {
      onChange('', null);
    }
  };

  const handleSelectOption = (opt) => {
    if (!opt) return;
    const optVal = typeof opt === 'object' ? opt.value : opt;
    const optLabel = typeof opt === 'object' ? opt.label : String(opt);
    setInputText(optLabel);
    onChange(optVal, opt);
    setIsOpen(false);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    setInputText('');
    onChange('', null);
    setIsOpen(false);
    if (inputRef.current) inputRef.current.focus();
  };

  // Keyboard navigation: Down, Up, Enter, Tab, Escape
  const handleKeyDown = (e) => {
    if (disabled) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        setHighlightedIndex(0);
      } else if (filteredOptions.length > 0) {
        setHighlightedIndex((prev) => (prev < filteredOptions.length - 1 ? prev + 1 : 0));
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        setHighlightedIndex(filteredOptions.length > 0 ? filteredOptions.length - 1 : 0);
      } else if (filteredOptions.length > 0) {
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : filteredOptions.length - 1));
      }
    } else if (e.key === 'Enter') {
      if (isOpen && filteredOptions.length > 0) {
        e.preventDefault();
        handleSelectOption(filteredOptions[highlightedIndex]);
      }
    } else if (e.key === 'Tab') {
      // If dropdown is open and an option is highlighted, select it before moving to next field
      if (isOpen && filteredOptions.length > 0) {
        handleSelectOption(filteredOptions[highlightedIndex]);
      }
      setIsOpen(false);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Searchable Input directly on the field */}
      <div className="relative w-full">
        <input
          ref={inputRef}
          id={id}
          type="text"
          value={inputText}
          disabled={disabled}
          autoComplete="off"
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => !disabled && setIsOpen(true)}
          placeholder={placeholder}
          className={`w-full py-2 pl-3 pr-8 bg-white border rounded-lg text-[13px] font-medium text-[#212B36] placeholder-[#646B72]/60 outline-none transition-all duration-150 shadow-2xs
            ${
              hasError
                ? 'border-red-500 bg-red-50/20 ring-2 ring-red-100'
                : isOpen
                ? 'border-[#FE9F43] ring-2 ring-[#FE9F43]/15'
                : 'border-gray-200 hover:border-gray-300'
            }
            ${disabled ? 'opacity-60 cursor-not-allowed bg-gray-100' : ''}
          `}
        />

        <div className="absolute inset-y-0 right-0 pr-2 flex items-center gap-1">
          {inputText && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              title="Clear"
              tabIndex={-1}
              className="text-gray-400 hover:text-gray-600 p-0.5 cursor-pointer"
            >
              <FiX className="text-[12px]" />
            </button>
          )}

          <button
            type="button"
            onClick={() => !disabled && setIsOpen((prev) => !prev)}
            tabIndex={-1}
            className="text-[#646B72] hover:text-[#212B36] p-0.5 cursor-pointer"
          >
            <FiChevronDown
              className={`text-[14px] transition-transform duration-200 ${
                isOpen ? 'rotate-180 text-[#FE9F43]' : ''
              }`}
            />
          </button>
        </div>
      </div>

      {/* Floating Options Dropdown with keyboard arrow highlight */}
      {isOpen && (
        <div
          ref={optionsListRef}
          tabIndex={-1}
          className="absolute z-50 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-52 overflow-y-auto divide-y divide-gray-50 animate-in fade-in zoom-in-95 duration-100 min-w-[200px]"
        >
          {filteredOptions.length > 0 ? (
            filteredOptions.map((opt, idx) => {
              const optVal = typeof opt === 'object' ? opt.value : opt;
              const optLabel = typeof opt === 'object' ? opt.label : opt;
              const optSub = typeof opt === 'object' && opt.sublabel ? String(opt.sublabel) : null;
              const isSelected = optVal === value;
              const isHighlighted = idx === highlightedIndex;

              return (
                <button
                  key={idx}
                  type="button"
                  tabIndex={-1}
                  onMouseEnter={() => setHighlightedIndex(idx)}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleSelectOption(opt);
                  }}
                  onClick={() => handleSelectOption(opt)}
                  className={`w-full px-3 py-2.5 sm:py-2 text-left text-[13px] sm:text-[12.5px] transition-colors flex items-center justify-between cursor-pointer ${
                    isHighlighted
                      ? 'bg-[#FFF5EC] text-[#FE9F43] font-bold'
                      : isSelected
                      ? 'bg-gray-50 font-bold text-[#212B36]'
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
                    <FiCheck className="text-[13px] text-[#FE9F43] shrink-0" />
                  )}
                </button>
              );
            })
          ) : (
            <div className="py-4 text-center text-[12px] text-[#646B72]">
              No results found
            </div>
          )}
        </div>
      )}
    </div>
  );
}
