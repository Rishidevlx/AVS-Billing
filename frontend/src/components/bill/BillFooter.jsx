import React from 'react';
import { FiPhone, FiMail, FiMapPin } from 'react-icons/fi';

export default function BillFooter({ company = {} }) {
  const mobile = company.mobile || '+91 8590605553';
  const email = company.email || 'support@avsbilling.com';
  const address = company.address || 'AVS Crackers, Sivakasi, Tamil Nadu - 626123';

  return (
    <div className="w-full bg-[#0D3B66] text-white py-3 px-5 font-['Nunito',sans-serif] print:bg-[#0D3B66]">
      <div className="flex flex-wrap items-center justify-between gap-3 text-[11.5px] font-semibold tracking-wide">
        {/* Mobile */}
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="p-1 rounded-full bg-white/15 text-white inline-flex items-center justify-center">
            <FiPhone className="text-[11px]" />
          </span>
          <span>{mobile}</span>
        </div>

        {/* Email */}
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="p-1 rounded-full bg-white/15 text-white inline-flex items-center justify-center">
            <FiMail className="text-[11px]" />
          </span>
          <span>{email}</span>
        </div>

        {/* Address */}
        <div className="flex items-center gap-1.5 min-w-[200px] max-w-md truncate">
          <span className="p-1 rounded-full bg-white/15 text-white inline-flex items-center justify-center shrink-0">
            <FiMapPin className="text-[11px]" />
          </span>
          <span className="truncate">{address}</span>
        </div>
      </div>
    </div>
  );
}
