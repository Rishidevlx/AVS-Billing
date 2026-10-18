import React, { useState, useEffect, useMemo } from 'react';
import { FiBox, FiCheckCircle, FiXCircle, FiTag } from 'react-icons/fi';

// Smooth counting animation component
export function AnimatedNumber({ value, duration = 800 }) {
  const [displayValue, setDisplayValue] = useState(0);

  const numericTarget = useMemo(() => {
    if (typeof value === 'number') return value;
    if (!value) return 0;
    const str = String(value).replace(/[^0-9.-]/g, '');
    return parseFloat(str) || 0;
  }, [value]);

  const prefix = useMemo(() => {
    if (typeof value === 'string' && value.includes('₹')) return '₹';
    if (typeof value === 'string' && value.includes('$')) return '$';
    return '';
  }, [value]);

  const suffix = useMemo(() => {
    if (typeof value === 'string') {
      const match = value.match(/(Bills|Units|Items|PCS|Boxes)/i);
      if (match) return ` ${match[0]}`;
    }
    return '';
  }, [value]);

  const isDecimal = useMemo(() => {
    return typeof value === 'string' && value.includes('.');
  }, [value]);

  useEffect(() => {
    let startTimestamp = null;
    let animationFrameId;

    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // Cubic ease-out
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const current = numericTarget * easeProgress;

      setDisplayValue(current);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step);
      } else {
        setDisplayValue(numericTarget);
      }
    };

    animationFrameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animationFrameId);
  }, [numericTarget, duration]);

  const formatted = isDecimal
    ? displayValue.toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    : Math.floor(displayValue).toLocaleString('en-IN');

  return (
    <span>
      {prefix}{formatted}{suffix}
    </span>
  );
}

// Mini Sparkline Bars Component (DreamsPOS Style)
function MiniSparkline({ color = '#FE9F43' }) {
  // 5 bar heights
  const bars = [10, 16, 12, 22, 18];
  return (
    <div className="flex items-end gap-1 h-6">
      {bars.map((h, i) => (
        <span
          key={i}
          className="w-1.5 rounded-t-sm transition-all duration-300"
          style={{
            height: `${h}px`,
            backgroundColor: color,
            opacity: 0.35 + (i * 0.15),
          }}
        />
      ))}
    </div>
  );
}

export default function ProductKpiCards({
  stats = {},
  cards: customCards,
  className = '',
}) {
  const {
    totalProducts = 0,
    activeProducts = 0,
    inactiveProducts = 0,
    totalCategories = 0,
  } = stats;

  const defaultCards = [
    {
      title: 'Total Products',
      value: totalProducts,
      subtext: 'Items in inventory',
      icon: FiBox,
      color: '#FE9F43',
      bgLight: 'bg-[#FFF5EC]',
      textColor: 'text-[#FE9F43]',
      badge: '+19.01%',
      badgeType: 'success',
    },
    {
      title: 'Active Products',
      value: activeProducts,
      subtext: 'Visible in billing',
      icon: FiCheckCircle,
      color: '#10B981',
      bgLight: 'bg-emerald-50',
      textColor: 'text-emerald-600',
      badge: 'Active',
      badgeType: 'success',
    },
    {
      title: 'Inactive Products',
      value: inactiveProducts,
      subtext: 'Hidden from billing',
      icon: FiXCircle,
      color: '#EF4444',
      bgLight: 'bg-rose-50',
      textColor: 'text-rose-600',
      badge: '0%',
      badgeType: 'danger',
    },
    {
      title: 'Total Categories',
      value: totalCategories,
      subtext: 'Product groups',
      icon: FiTag,
      color: '#6366F1',
      bgLight: 'bg-indigo-50',
      textColor: 'text-indigo-600',
      badge: '+6%',
      badgeType: 'info',
    },
  ];

  const cardsToRender = customCards && customCards.length > 0 ? customCards : defaultCards;

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4.5 ${className}`}>
      {cardsToRender.map((card, idx) => {
        const Icon = card.icon;
        const cardColor = card.color || '#FE9F43';

        return (
          <div
            key={idx}
            className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs hover:border-gray-200 hover:shadow-md transition-all duration-200 group flex flex-col justify-between"
          >
            {/* Top row: Icon on left, Badge on right (DreamsPOS Style) */}
            <div className="flex items-center justify-between">
              <div
                className={`w-10 h-10 rounded-xl ${card.bgLight || 'bg-gray-100'} ${card.textColor || 'text-gray-700'} flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform duration-200`}
              >
                <Icon className="text-[20px]" />
              </div>

              {card.badge && (
                <span
                  className={`text-[11px] font-extrabold px-2 py-0.5 rounded-full ${
                    card.badgeType === 'danger'
                      ? 'bg-rose-50 text-rose-600 border border-rose-100'
                      : card.badgeType === 'info'
                      ? 'bg-blue-50 text-blue-600 border border-blue-100'
                      : card.badgeType === 'primary'
                      ? 'bg-amber-50 text-amber-600 border border-amber-100'
                      : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                  }`}
                >
                  {card.badge}
                </span>
              )}
            </div>

            {/* Bottom Row: Number + Title on left, Mini Sparkline on right */}
            <div className="mt-4 flex items-end justify-between">
              <div>
                <h3 className="text-[24px] font-extrabold text-[#212B36] tracking-tight leading-none">
                  <AnimatedNumber value={card.value} />
                </h3>
                <p className="text-[12.5px] font-semibold text-[#646B72] mt-1.5">
                  {card.title}
                </p>
                {card.subtext && (
                  <p className="text-[11px] text-[#94A3B8] font-medium mt-0.5">
                    {card.subtext}
                  </p>
                )}
              </div>

              {/* Sparkline bars */}
              <div className="shrink-0 mb-1">
                <MiniSparkline color={cardColor} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
