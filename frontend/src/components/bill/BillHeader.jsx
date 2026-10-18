import React from 'react';

export default function BillHeader({ company = {}, receiptNumber = '', receiptDate = '' }) {
  const companyName = company.companyName || company.company_name || 'AVS CRACKERS';
  const logo = company.logo || company.logo_url || localStorage.getItem('company_logo') || '';
  const address = company.address || '';
  const mobile = company.mobile || '';
  const email = company.email || '';
  const gstin = company.gstin || '';

  const formattedDate = receiptDate
    ? new Date(receiptDate).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : new Date().toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });

  return (
    <div className="w-full font-['Nunito',sans-serif]">
      {/* Top Company Info Bar */}
      <div className="flex items-start justify-between gap-4 pb-4 border-b border-gray-200">
        <div className="flex items-center gap-3.5">
          {logo ? (
            <img
              src={logo}
              alt={companyName}
              crossOrigin="anonymous"
              className="w-16 h-16 object-contain rounded-md shrink-0 border border-gray-100"
            />
          ) : (
            <div className="w-14 h-14 rounded-lg bg-[#0D3B66] text-white flex items-center justify-center font-bold text-xl shrink-0">
              {companyName.slice(0, 2).toUpperCase()}
            </div>
          )}
          <div>
            <h1 className="text-[20px] font-extrabold text-[#0D3B66] tracking-tight uppercase leading-tight">
              {companyName}
            </h1>
            {address && (
              <p className="text-[12px] text-[#646B72] font-medium leading-relaxed max-w-md mt-0.5">
                {address}
              </p>
            )}
            <p className="text-[12px] text-[#212B36] font-semibold mt-0.5">
              {mobile && <span>Mobile: {mobile}</span>}
              {mobile && email && <span className="mx-2 text-gray-300">|</span>}
              {email && <span>Email: {email}</span>}
            </p>
          </div>
        </div>

        {gstin && (
          <div className="text-right shrink-0">
            <span className="text-[11.5px] font-bold text-[#646B72] uppercase tracking-wider block">
              GSTIN
            </span>
            <span className="text-[13px] font-bold text-[#212B36] font-mono tracking-wide">
              {gstin}
            </span>
          </div>
        )}
      </div>

      {/* Receipt Number & Date Strip */}
      <div className="bg-[#F8FAFC] border-b border-gray-200 px-4 py-2.5 flex items-center justify-between text-[12.5px]">
        <div>
          <span className="text-[#646B72] font-semibold tracking-wide uppercase mr-2 text-[11px]">
            Receipt Number:
          </span>
          <span className="font-extrabold text-[#0D3B66] font-mono text-[13px] tracking-wider">
            {receiptNumber || 'REC/0001'}
          </span>
        </div>
        <div>
          <span className="text-[#646B72] font-semibold tracking-wide uppercase mr-2 text-[11px]">
            Receipt Date:
          </span>
          <span className="font-bold text-[#212B36]">
            {formattedDate}
          </span>
        </div>
      </div>
    </div>
  );
}
