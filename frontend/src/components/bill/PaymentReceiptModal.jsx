import React, { useRef, useState, useEffect } from 'react';
import {
  FiPrinter,
  FiDownload,
  FiX,
  FiFileText,
  FiCheckCircle,
  FiCloud,
} from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import BillHeader from './BillHeader';
import BillFooter from './BillFooter';
import { showToast } from '../../utils/alert';

export default function PaymentReceiptModal({
  isOpen,
  onClose,
  invoice = null,
  onPdfUploaded = null,
}) {
  const receiptRef = useRef(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [company, setCompany] = useState({});
  const [bank, setBank] = useState({});
  const [cloudinaryUrl, setCloudinaryUrl] = useState(invoice?.pdfUrl || '');

  const apiBase = import.meta.env.VITE_API_BASE_URL || '';

  // Update cloudinaryUrl when invoice prop changes
  useEffect(() => {
    if (invoice?.pdfUrl) {
      setCloudinaryUrl(invoice.pdfUrl);
    }
  }, [invoice]);

  // Load company and bank details
  useEffect(() => {
    if (!isOpen) return;

    const fetchDetails = async () => {
      try {
        const [compRes, bankRes] = await Promise.all([
          fetch(`${apiBase}/api/v1/company`, { credentials: 'include' }),
          fetch(`${apiBase}/api/v1/bank`, { credentials: 'include' }),
        ]);

        if (compRes.ok) {
          const compData = await compRes.json();
          if (compData.data) setCompany(compData.data);
        }
        if (bankRes.ok) {
          const bankData = await bankRes.json();
          if (bankData.data) setBank(bankData.data);
        }
      } catch (err) {
        console.warn('Failed to load company or bank details for receipt:', err);
      }
    };

    fetchDetails();
  }, [isOpen, apiBase]);

  if (!isOpen || !invoice) return null;

  const invNumber = invoice.invoiceNumber || 'REC/0001';
  const invDate = invoice.invoiceDate || new Date().toISOString();
  const customerName = invoice.customerName || invoice.customer?.name || 'Customer';
  const customerMobile = invoice.customerMobile || invoice.customer?.mobile || '-';
  const billingAddress = invoice.billingAddress || invoice.customer?.billingAddress || '-';
  const deliveryAddress = invoice.deliveryAddress || invoice.customer?.deliveryAddress || billingAddress;
  const isSameAddress = !deliveryAddress || deliveryAddress === billingAddress;

  const items = invoice.items || [];
  const subtotal = Number(invoice.subtotal || 0);
  const discountPercent = Number(invoice.discountPercent || 0);
  const discountAmount = Number(invoice.discountAmount || 0);
  const grandTotal = Number(invoice.grandTotal || 0);
  const amountInWords = invoice.amountInWords || '';
  const totalQty = invoice.totalQty || items.reduce((s, i) => s + (Number(i.qty) || 1), 0);

  // Generate Base64 PDF / image from receipt DOM
  const generatePdfBlob = async () => {
    if (!receiptRef.current) return null;

    const canvas = await html2canvas(receiptRef.current, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#FFFFFF',
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
    return {
      pdfDataUri: pdf.output('datauristring'),
      pdfBlob: pdf.output('blob'),
      pdfInstance: pdf,
    };
  };

  // Upload to Cloudinary
  const handleUploadToCloudinary = async () => {
    if (cloudinaryUrl) return cloudinaryUrl;

    setIsGenerating(true);
    try {
      const generated = await generatePdfBlob();
      if (!generated) throw new Error('Failed to render receipt canvas');

      const res = await fetch(`${apiBase}/api/v1/invoices/${invoice.id || invoice.invoiceNumber}/pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ pdfBase64: generated.pdfDataUri }),
      });

      const data = await res.json();
      if (res.ok && data.success && data.data?.pdfUrl) {
        const url = data.data.pdfUrl;
        setCloudinaryUrl(url);
        if (onPdfUploaded) onPdfUploaded(url);
        showToast('Receipt PDF uploaded to Cloudinary successfully!', 'success');
        return url;
      } else {
        throw new Error(data.message || 'Upload failed');
      }
    } catch (err) {
      console.error('Cloudinary upload error:', err);
      showToast(err.message || 'Failed to upload PDF to Cloudinary', 'error');
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  // Print Receipt
  const handlePrint = () => {
    window.print();
  };

  // Download PDF locally
  const handleDownloadPdf = async () => {
    setIsGenerating(true);
    try {
      const generated = await generatePdfBlob();
      if (generated) {
        generated.pdfInstance.save(`${invNumber.replace(/[^a-zA-Z0-9-_]/g, '_')}.pdf`);
        showToast('Receipt PDF downloaded successfully', 'success');
      }
    } catch (err) {
      showToast('Failed to download PDF', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  // Share on WhatsApp with Cloudinary link
  const handleWhatsAppWithPdf = async () => {
    let finalPdfUrl = cloudinaryUrl;
    if (!finalPdfUrl) {
      finalPdfUrl = await handleUploadToCloudinary();
    }

    const rawMobile = customerMobile.replace(/\D/g, '');
    if (!rawMobile || rawMobile.length < 10) {
      showToast('Customer mobile number is not available or invalid', 'warning');
      return;
    }

    const companyName = company.companyName || company.company_name || 'AVS Crackers';
    let messageText = `*${companyName} - Receipt Update*\n\nDear *${customerName}*,\nThank you for choosing us! Your outward bill has been generated successfully.\n\n*Receipt No:* ${invNumber}\n*Amount Payable:* ₹${grandTotal.toFixed(2)}`;

    if (finalPdfUrl) {
      messageText += `\n\n*Download / View Receipt PDF:*\n${finalPdfUrl}`;
    }

    messageText += `\n\nFor any queries, please feel free to reach out. Have a great day!`;

    const encodedText = encodeURIComponent(messageText);
    const waUrl = `https://wa.me/91${rawMobile.slice(-10)}?text=${encodedText}`;

    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 print:p-0 print:bg-white print:static print:inset-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-4xl overflow-hidden flex flex-col max-h-[92vh] print:max-h-none print:shadow-none print:border-none print:rounded-none">
        {/* Modal Top Header (Hidden on Print) */}
        <div className="px-6 py-4 bg-[#F8FAFC] border-b border-gray-200 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#0D3B66]/10 text-[#0D3B66] flex items-center justify-center font-bold">
              <FiFileText className="text-[18px]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-[16px] font-extrabold text-[#0D3B66] tracking-tight">
                  PAYMENT RECEIPT PREVIEW
                </h3>
                <span className="font-mono font-bold text-[13px] text-[#FE9F43]">
                  #{invNumber}
                </span>
              </div>
              <p className="text-[12px] font-medium text-[#646B72]">
                Official payment receipt • Customer: <span className="font-semibold text-[#212B36]">{customerName}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* WhatsApp Share with PDF link */}
            <button
              type="button"
              onClick={handleWhatsAppWithPdf}
              disabled={isGenerating}
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-[12.5px] font-bold shadow-xs transition-all cursor-pointer"
            >
              <FaWhatsapp className="text-[14px]" />
              <span className="hidden sm:inline">WhatsApp Receipt</span>
            </button>

            {/* Print Button */}
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-2 bg-[#0D3B66] hover:bg-[#0D3B66]/90 text-white rounded-lg text-[12.5px] font-bold shadow-xs transition-all cursor-pointer"
            >
              <FiPrinter className="text-[14px]" />
              <span className="hidden sm:inline">Print Receipt</span>
            </button>

            {/* Download PDF Button */}
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isGenerating}
              className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-[#212B36] rounded-lg text-[12.5px] font-bold shadow-2xs transition-all cursor-pointer"
            >
              <FiDownload className="text-[14px]" />
              <span className="hidden sm:inline">Download PDF</span>
            </button>

            {/* Upload to Cloudinary Button */}
            {!cloudinaryUrl ? (
              <button
                type="button"
                onClick={handleUploadToCloudinary}
                disabled={isGenerating}
                title="Upload to Cloudinary"
                className="flex items-center gap-1.5 px-2.5 py-2 bg-[#FFF5EC] text-[#FE9F43] hover:bg-[#FE9F43] hover:text-white rounded-lg text-[12px] font-bold transition-all cursor-pointer"
              >
                <FiCloud className="text-[14px]" />
                <span className="hidden md:inline">Sync Cloud</span>
              </button>
            ) : (
              <span className="hidden lg:inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200">
                <FiCheckCircle className="text-[12px]" /> Cloud Ready
              </span>
            )}

            {/* Close Modal */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all cursor-pointer ml-1"
            >
              <FiX className="text-[18px]" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body containing Receipt Document */}
        <div className="overflow-y-auto p-4 sm:p-8 bg-gray-100/70 print:p-0 print:bg-white print:overflow-visible">
          {/* Printable Receipt Card */}
          <div
            ref={receiptRef}
            className="w-full max-w-3xl mx-auto bg-white border border-gray-200 shadow-md print:shadow-none print:border-none font-['Nunito',sans-serif]"
          >
            {/* 1. Global Bill Header */}
            <BillHeader
              company={company}
              receiptNumber={invNumber}
              receiptDate={invDate}
            />

            {/* 2. Customer Details Split (2-Columns) - Uniform font style and weight */}
            <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-gray-200 border-b border-gray-200">
              {/* Left Column: Customer Details */}
              <div className="p-4 space-y-1.5 text-[12.5px] text-[#1E293B]">
                <span className="text-[11px] font-bold text-[#0D3B66] uppercase tracking-wider block">
                  Customer Details
                </span>
                <p className="font-normal text-[#1E293B]">
                  {customerName}
                </p>
                <p className="font-normal text-[#1E293B] leading-relaxed whitespace-pre-line">
                  {billingAddress}
                </p>
                <p className="font-normal text-[#1E293B] pt-0.5">
                  Mobile: <span className="font-mono">{customerMobile}</span>
                </p>
              </div>

              {/* Right Column: Delivery Address */}
              <div className="p-4 space-y-1.5 text-[12.5px] text-[#1E293B]">
                <span className="text-[11px] font-bold text-[#0D3B66] uppercase tracking-wider block">
                  Delivery Address
                </span>
                <p className="font-normal text-[#1E293B]">
                  {customerName}
                </p>
                <p className="font-normal text-[#1E293B] leading-relaxed whitespace-pre-line">
                  {deliveryAddress}
                </p>
                <p className="font-normal text-[#1E293B] pt-0.5">
                  Mobile: <span className="font-mono">{customerMobile}</span>
                </p>
              </div>
            </div>

            {/* 3. Product Line Items Table (Normal, Clean & Professional Table) */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-[12.5px]">
                <thead>
                  <tr className="bg-[#F1F5F9] border-y border-gray-300 text-[#0F172A] text-[11px] font-bold uppercase tracking-wider">
                    <th className="py-2 px-3 text-center w-12 border-r border-gray-200">S.No</th>
                    <th className="py-2 px-3 border-r border-gray-200">Item Name</th>
                    <th className="py-2 px-3 w-32 border-r border-gray-200">Category</th>
                    <th className="py-2 px-3 text-center w-16 border-r border-gray-200">Qty</th>
                    <th className="py-2 px-3 text-right w-24 border-r border-gray-200">Rate (₹)</th>
                    <th className="py-2 px-3 text-right w-28">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 text-[#1E293B]">
                  {items.map((it, idx) => (
                    <tr key={it.id || idx} className="hover:bg-gray-50/50">
                      <td className="py-2 px-3 text-center font-normal text-[#1E293B] border-r border-gray-200">
                        {idx + 1}
                      </td>
                      <td className="py-2 px-3 font-normal text-[#1E293B] border-r border-gray-200">
                        {it.productName || it.name || 'Item'}
                      </td>
                      <td className="py-2 px-3 font-normal text-[#1E293B] border-r border-gray-200">
                        {it.category || '-'}
                      </td>
                      <td className="py-2 px-3 text-center font-normal text-[#1E293B] border-r border-gray-200">
                        {it.qty || 1}
                      </td>
                      <td className="py-2 px-3 text-right font-normal font-mono text-[#1E293B] border-r border-gray-200">
                        {Number(it.rate || 0).toFixed(2)}
                      </td>
                      <td className="py-2 px-3 text-right font-normal font-mono text-[#1E293B]">
                        {Number(it.total || (Number(it.rate || 0) * Number(it.qty || 1))).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                  {/* Total Items Row */}
                  <tr className="bg-[#F1F5F9] border-t border-gray-300 font-bold text-[12px] text-[#0F172A]">
                    <td colSpan={3} className="py-2 px-3 text-left uppercase tracking-wider border-r border-gray-200">
                      Total Items: {items.length}
                    </td>
                    <td className="py-2 px-3 text-center border-r border-gray-200">
                      {totalQty}
                    </td>
                    <td className="py-2 px-3 border-r border-gray-200"></td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-[#0F172A]">
                      ₹{subtotal.toFixed(2)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 4. Bottom Section: Left Empty, Right Side Amounts, Words & Signature */}
            <div className="grid grid-cols-1 sm:grid-cols-2 border-t border-gray-200 divide-y sm:divide-y-0 sm:divide-x divide-gray-200">
              {/* Left Column: Completely Empty */}
              <div className="p-4 hidden sm:block"></div>

              {/* Right Column: Amount Summary & Signature */}
              <div className="p-4 flex flex-col justify-between text-[12px]">
                <div className="space-y-1.5 pb-2">
                  <div className="flex justify-between text-[#646B72]">
                    <span>Gross Amount:</span>
                    <span className="font-mono text-[#1E293B] font-medium">₹{subtotal.toFixed(2)}</span>
                  </div>

                  {discountPercent > 0 && (
                    <div className="flex justify-between text-emerald-600 font-medium">
                      <span>Discount ({discountPercent}%):</span>
                      <span className="font-mono">- ₹{discountAmount.toFixed(2)}</span>
                    </div>
                  )}

                  <div className="pt-2 border-t border-gray-200 flex justify-between items-center bg-[#F8FAFC] p-2 rounded border border-[#0D3B66]/20">
                    <span className="font-bold text-[#0D3B66] text-[12.5px] uppercase">
                      Total Amount:
                    </span>
                    <span className="text-[16px] font-bold text-[#0D3B66] font-mono">
                      ₹{grandTotal.toFixed(2)}
                    </span>
                  </div>

                  {/* Amount in Words right below Total Amount */}
                  {amountInWords && (
                    <div className="text-right pt-1">
                      <span className="text-[11px] text-[#646B72]">
                        Amount in Words: <span className="font-medium text-[#1E293B]">{amountInWords}</span>
                      </span>
                    </div>
                  )}
                </div>

                {/* Authorized Signatory with top margin & underline */}
                <div className="pt-8 border-t border-gray-100 text-right">
                  <div className="inline-block text-center min-w-[130px]">
                    {company.signature ? (
                      <img
                        src={company.signature}
                        alt="Authorized Signature"
                        className="h-10 object-contain mx-auto mb-1"
                      />
                    ) : (
                      <div className="h-6"></div>
                    )}
                    {/* Underline */}
                    <div className="w-full border-b border-gray-300 mb-1.5"></div>
                    <p className="text-[10.5px] font-medium text-[#646B72] uppercase tracking-wider">
                      Authorized Signatory
                    </p>
                    <p className="text-[11px] font-bold text-[#0D3B66]">
                      {company.companyName || 'AVS CRACKERS'}
                    </p>
                  </div>
                  {/* Note below AVS CRACKERS */}
                  <p className="text-[10.5px] text-[#646B72] italic pt-2">
                    Note: Thank you for your business!
                  </p>
                </div>
              </div>
            </div>

            {/* 5. Global Bill Footer */}
            <BillFooter company={company} />
          </div>
        </div>
      </div>
    </div>
  );
}
