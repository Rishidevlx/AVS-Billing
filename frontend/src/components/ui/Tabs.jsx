import React from 'react';

export default function Tabs({
  tabs = [],
  activeTab,
  onChange,
  className = '',
}) {
  return (
    <div className={`w-full border-b border-gray-200 ${className}`}>
      <div className="flex items-center gap-6 sm:gap-8 overflow-x-auto no-scrollbar">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              className={`relative pb-3 pt-1 text-[14.5px] transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 select-none outline-none ${
                isActive
                  ? 'text-[#FE9F43] font-bold'
                  : 'text-[#646B72] hover:text-[#212B36] font-semibold'
              }`}
            >
              {Icon && (
                <Icon
                  className={`text-[17px] transition-colors ${
                    isActive ? 'text-[#FE9F43]' : 'text-[#646B72]'
                  }`}
                />
              )}
              <span>{tab.label}</span>

              {/* Active Underline Indicator Bar (Matching Reference Screenshot Row 1) */}
              {isActive && (
                <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#FE9F43] rounded-t-full transition-all duration-200" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
