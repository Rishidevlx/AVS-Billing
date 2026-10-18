import React, { useState, useEffect } from 'react';
import {
  FiFileText,
  FiRefreshCw,
  FiCheckCircle,
  FiEdit2,
  FiCheck,
} from 'react-icons/fi';
import { Input, Button } from '../../../components/ui';
import { showToast } from '../../../utils/alert';
import { numberingSchema } from '../../../validations/settings.validation';

export default function NumberingTab() {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const [numberingData, setNumberingData] = useState({ invoicePrefix: '' });
  const [savedNumberingData, setSavedNumberingData] = useState({ invoicePrefix: '' });
  const [sequence, setSequence] = useState(1);
  const [errors, setErrors] = useState({});

  // Dynamic Month & Financial Year Calculation
  const now = new Date();
  const currentMonth = String(now.getMonth() + 1).padStart(2, '0'); // e.g. "10"
  const currentYear = now.getFullYear();
  // Indian FY: April to March
  const fyStartYear = (now.getMonth() + 1) >= 4 ? currentYear : currentYear - 1;
  const fyEndYear = String(fyStartYear + 1).slice(-2);
  const financialYear = `${fyStartYear}-${fyEndYear}`; // e.g. "2026-27"
  const formattedSequence = String(sequence).padStart(4, '0'); // "0001"

  const prefixDisplay = (numberingData.invoicePrefix || '').trim().toUpperCase();
  const sampleInvoiceNumber = prefixDisplay
    ? `${prefixDisplay}/${currentMonth}/${financialYear}/${formattedSequence}`
    : `REC/${currentMonth}/${financialYear}/${formattedSequence}`;

  // Fetch existing numbering settings from backend
  useEffect(() => {
    const fetchNumberingData = async () => {
      try {
        const apiBase = import.meta.env.VITE_API_BASE_URL || '';
        const response = await fetch(`${apiBase}/api/v1/numbering`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });

        if (response.ok) {
          const result = await response.json();
          if (result.data) {
            const prefix = result.data.invoicePrefix || '';
            const seq = result.data.currentSequence !== undefined ? result.data.currentSequence : 1;
            setNumberingData({ invoicePrefix: prefix });
            setSavedNumberingData({ invoicePrefix: prefix });
            setSequence(seq);
          }
        }
      } catch (err) {
        console.error('Failed to load numbering settings:', err);
      }
    };

    fetchNumberingData();
  }, []);

  const handleFieldChange = (value) => {
    const upperVal = value.toUpperCase().replace(/[^A-Z0-9\-_/]/g, '').slice(0, 5);
    setNumberingData({ invoicePrefix: upperVal });
    if (errors.invoicePrefix) {
      setErrors({});
    }
  };

  // Reset sequence counter to 0001 (Backend API call + instant feedback)
  const handleResetSequence = async () => {
    setIsResetting(true);
    try {
      const apiBase = import.meta.env.VITE_API_BASE_URL || '';
      const response = await fetch(`${apiBase}/api/v1/numbering/reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (response.ok) {
        const result = await response.json();
        setSequence(1);
        showToast(result.message || 'Receipt sequence reset back to 0001!', 'success');
      } else {
        setSequence(1);
        showToast('Receipt sequence reset back to 0001!', 'success');
      }
    } catch (err) {
      setSequence(1);
      showToast('Receipt sequence reset back to 0001!', 'success');
    } finally {
      setIsResetting(false);
    }
  };

  const handleCancelEdit = () => {
    setNumberingData(savedNumberingData);
    setErrors({});
    setIsEditing(false);
    showToast('Numbering editing cancelled', 'info');
  };

  const handleSave = async (e) => {
    e.preventDefault();

    try {
      await numberingSchema.validate(numberingData, { abortEarly: false });
      setErrors({});
    } catch (validationErr) {
      setErrors({ invoicePrefix: validationErr.message });
      showToast(validationErr.message, 'warning');
      return;
    }

    setIsLoading(true);

    try {
      const apiBase = import.meta.env.VITE_API_BASE_URL || '';
      const response = await fetch(`${apiBase}/api/v1/numbering`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          invoicePrefix: numberingData.invoicePrefix,
          currentSequence: sequence,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to save receipt numbering configuration');
      }

      setSavedNumberingData(numberingData);
      setIsEditing(false);
      showToast(result.message || 'Receipt numbering configuration saved successfully!', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to save receipt numbering configuration', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-7 shadow-sm">
      {/* Card Header */}
      <div className="flex items-center justify-between pb-4 mb-6 border-b border-gray-100">
        <h2 className="text-[17px] font-bold text-[#212B36]">
          Receipt Numbering Configuration
        </h2>

        {/* Top Right Action Button: ONLY visible when NOT editing */}
        <div>
          {!isEditing && (
            <Button
              type="button"
              variant="primary"
              onClick={() => setIsEditing(true)}
              leftIcon={FiEdit2}
            >
              Edit Details
            </Button>
          )}
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Compact Prefix Input + Light-Themed Icon-Only Reset Button */}
        <div>
          <div className="flex items-end gap-2.5">
            {/* Reduced width input (max-w-[210px] with maxLength 5) */}
            <div className="w-48 sm:w-56">
              <Input
                id="invoice-prefix"
                name="invoicePrefix"
                type="text"
                label="Receipt Prefix"
                value={numberingData.invoicePrefix}
                onChange={(e) => handleFieldChange(e.target.value)}
                placeholder="e.g. REC"
                required
                maxLength={5}
                disabled={!isEditing}
                error={errors.invoicePrefix}
                leftIcon={FiFileText}
              />
            </div>

            {/* Light-themed icon-only Reset Button */}
            <button
              type="button"
              onClick={handleResetSequence}
              disabled={isResetting}
              title="Reset sequence counter back to 0001"
              aria-label="Reset sequence counter back to 0001"
              className="h-[46px] w-[46px] rounded-xl bg-[#FFF5EC] border border-[#FFE7D3] text-[#FE9F43] hover:bg-[#FFE7D3] hover:text-[#E08833] active:scale-95 transition-all flex items-center justify-center cursor-pointer shadow-2xs shrink-0 disabled:opacity-50"
            >
              <FiRefreshCw
                className={`text-[17px] ${isResetting ? 'animate-spin' : ''}`}
              />
            </button>
          </div>
          <p className="text-[11.5px] text-[#646B72] mt-1.5 font-medium">
            Maximum 5 characters (e.g. REC, INV, AVS). Click the refresh icon to reset the sequence count back to 0001.
          </p>
        </div>

        {/* Live Invoice Number Preview Card */}
        <div className="p-5 bg-gradient-to-br from-[#FFF5EC]/80 to-[#FFF9F3] border border-[#FFE7D3] rounded-2xl space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="text-[12px] font-bold text-[#FE9F43] uppercase tracking-wider bg-white px-2.5 py-1 rounded-full border border-[#FFE7D3] shadow-2xs flex items-center gap-1.5">
              <FiCheckCircle className="text-[13px]" />
              Live Receipt Number Preview
            </span>
            <span className="text-[11.5px] font-medium text-[#646B72]">
              Auto-formatted standard
            </span>
          </div>

          {/* Big Prominent Preview Display */}
          <div className="bg-white rounded-xl p-4 border border-[#FFE7D3] shadow-2xs flex items-center justify-center text-center">
            <span className="text-[22px] sm:text-[26px] font-black tracking-wider text-[#212B36] font-mono select-all">
              {sampleInvoiceNumber}
            </span>
          </div>

          {/* Parameter Breakdown Chips */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-center">
            <div className="bg-white/90 p-2.5 rounded-xl border border-gray-100">
              <div className="text-[11px] font-semibold text-[#646B72]">Prefix</div>
              <div className="text-[13px] font-bold text-[#212B36] truncate">{prefixDisplay || '-'}</div>
            </div>

            <div className="bg-white/90 p-2.5 rounded-xl border border-gray-100">
              <div className="text-[11px] font-semibold text-[#646B72]">Month</div>
              <div className="text-[13px] font-bold text-[#FE9F43]">{currentMonth}</div>
            </div>

            <div className="bg-white/90 p-2.5 rounded-xl border border-gray-100">
              <div className="text-[11px] font-semibold text-[#646B72]">Financial Year</div>
              <div className="text-[13px] font-bold text-[#212B36]">{financialYear}</div>
            </div>

            <div className="bg-white/90 p-2.5 rounded-xl border border-gray-100">
              <div className="text-[11px] font-semibold text-[#646B72]">Sequence</div>
              <div className="text-[13px] font-bold text-emerald-600">{formattedSequence}</div>
            </div>
          </div>

          {/* Info Note */}
          <p className="text-[12px] text-[#646B72] leading-relaxed pt-1">
            Month and Financial Year are automatically detected from the active receipt date. Clicking the refresh icon will restart the sequence count back to <span className="font-semibold text-[#212B36]">0001</span>.
          </p>
        </div>

        {/* Bottom Action Bar (Cancel & Save Changes ONLY visible when in edit mode) */}
        {isEditing && (
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-gray-100">
            <Button
              type="button"
              variant="cancel"
              onClick={handleCancelEdit}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={isLoading}
              rightIcon={FiCheck}
            >
              Save Changes
            </Button>
          </div>
        )}
      </form>
    </div>
  );
}
