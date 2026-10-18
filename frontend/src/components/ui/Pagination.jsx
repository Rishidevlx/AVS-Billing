import React from 'react';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

export default function Pagination({
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  pageSize = 10,
  onPageChange,
  className = '',
}) {
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    const safeTotal = Math.max(1, totalPages);

    if (safeTotal <= maxVisible) {
      for (let i = 1; i <= safeTotal; i++) pages.push(i);
    } else {
      let start = Math.max(1, currentPage - 2);
      let end = Math.min(safeTotal, start + maxVisible - 1);

      if (end - start < maxVisible - 1) {
        start = Math.max(1, end - maxVisible + 1);
      }

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
    }
    return pages.length > 0 ? pages : [1];
  };

  const pages = getPageNumbers();

  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-3 select-none ${className}`}
    >
      {/* Information text */}
      <span className="text-[12.5px] font-medium text-[#646B72]">
        Showing <span className="font-bold text-[#212B36]">{startItem}</span> to{' '}
        <span className="font-bold text-[#212B36]">{endItem}</span> of{' '}
        <span className="font-bold text-[#212B36]">{totalItems}</span> entries
      </span>

      {/* Dreams POS Boxed Pagination Controls */}
      <div className="flex items-center gap-1.5 self-end sm:self-auto">
        {/* Previous Button */}
        <button
          type="button"
          onClick={() => currentPage > 1 && onPageChange && onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          title="Previous Page"
          className={`w-8.5 h-8.5 rounded-lg border flex items-center justify-center text-[14px] transition-all cursor-pointer ${
            currentPage === 1
              ? 'border-gray-200 text-gray-300 bg-gray-50/50 cursor-not-allowed'
              : 'border-gray-200 text-[#646B72] bg-white hover:bg-[#FFF5EC] hover:text-[#FE9F43] hover:border-[#FFE7D3] shadow-xs active:scale-95'
          }`}
        >
          <FiChevronLeft />
        </button>

        {/* Page Number Buttons */}
        {pages.map((p) => {
          const isActive = p === currentPage;
          return (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange && onPageChange(p)}
              className={`w-8.5 h-8.5 rounded-lg text-[13px] font-bold flex items-center justify-center transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#FE9F43] text-white shadow-xs shadow-[#FE9F43]/20 border border-[#FE9F43]'
                  : 'bg-white border border-gray-200 text-[#646B72] hover:bg-[#FFF5EC] hover:text-[#FE9F43] hover:border-[#FFE7D3] shadow-xs active:scale-95'
              }`}
            >
              {p}
            </button>
          );
        })}

        {/* Next Button */}
        <button
          type="button"
          onClick={() => currentPage < totalPages && onPageChange && onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          title="Next Page"
          className={`w-8.5 h-8.5 rounded-lg border flex items-center justify-center text-[14px] transition-all cursor-pointer ${
            currentPage === totalPages
              ? 'border-gray-200 text-gray-300 bg-gray-50/50 cursor-not-allowed'
              : 'border-gray-200 text-[#646B72] bg-white hover:bg-[#FFF5EC] hover:text-[#FE9F43] hover:border-[#FFE7D3] shadow-xs active:scale-95'
          }`}
        >
          <FiChevronRight />
        </button>
      </div>
    </div>
  );
}
