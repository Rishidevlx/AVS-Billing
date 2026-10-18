import React from 'react';
import { FiInbox } from 'react-icons/fi';

export default function Table({
  columns = [],
  data = [],
  keyField = 'id',
  selectedId = null,
  emptyText = 'No records found.',
  className = '',
}) {
  return (
    <div className={`overflow-x-auto rounded-lg border border-gray-100 ${className}`}>
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-[#F8FAFC] border-b border-gray-100">
            {columns.map((col, idx) => {
              const alignClass =
                col.align === 'center'
                  ? 'text-center'
                  : col.align === 'right'
                  ? 'text-right'
                  : 'text-left';

              return (
                <th
                  key={col.key || idx}
                  className={`py-3 px-4 text-[12px] font-bold text-[#646B72] uppercase tracking-wider ${alignClass} ${
                    col.width || ''
                  }`}
                >
                  {col.title || col.label}
                </th>
              );
            })}
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-100 text-[13.5px]">
          {data.length > 0 ? (
            data.map((row, index) => {
              const rowKey = row[keyField] !== undefined ? row[keyField] : index;
              const isSelected = selectedId && selectedId === rowKey;

              return (
                <tr
                  key={rowKey}
                  className={`transition-colors duration-150 ${
                    isSelected
                      ? 'bg-[#FFF9F3] border-l-4 border-l-[#FE9F43]'
                      : 'hover:bg-[#FFF9F3]/40'
                  }`}
                >
                  {columns.map((col, cIdx) => {
                    const alignClass =
                      col.align === 'center'
                        ? 'text-center'
                        : col.align === 'right'
                        ? 'text-right'
                        : 'text-left';

                    const value = col.key ? row[col.key] : null;

                    return (
                      <td
                        key={col.key || cIdx}
                        className={`py-3 px-4 ${alignClass} ${
                          col.cellClassName || ''
                        }`}
                      >
                        {col.render ? col.render(value, row, index) : value ?? '-'}
                      </td>
                    );
                  })}
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan={columns.length} className="py-12 text-center">
                <div className="flex flex-col items-center justify-center max-w-sm mx-auto text-center">
                  <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-[#646B72] mb-2.5">
                    <FiInbox className="text-[20px]" />
                  </div>
                  <p className="text-[14px] font-bold text-[#212B36]">
                    {emptyText}
                  </p>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
