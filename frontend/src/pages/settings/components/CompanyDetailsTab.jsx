import React, { useState, useEffect, useRef } from 'react';
import {
  FiBriefcase,
  FiFileText,
  FiPhone,
  FiMail,
  FiMapPin,
  FiEdit2,
  FiCheck,
  FiUploadCloud,
  FiTrash2,
  FiImage,
} from 'react-icons/fi';
import { Input, Button } from '../../../components/ui';
import { showToast } from '../../../utils/alert';
import { companyDetailsSchema } from '../../../validations/settings.validation';

export default function CompanyDetailsTab() {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const fileInputRef = useRef(null);
  const logoInputRef = useRef(null);

  const emptyCompanyData = {
    companyName: '',
    gstin: '',
    mobile: '',
    email: '',
    address: '',
    logo: '',
    signature: '',
  };

  const [companyData, setCompanyData] = useState(emptyCompanyData);
  const [savedData, setSavedData] = useState(emptyCompanyData);
  const [errors, setErrors] = useState({});

  // Fetch company details on mount
  useEffect(() => {
    const fetchCompanyData = async () => {
      try {
        const apiBase = import.meta.env.VITE_API_BASE_URL || '';
        const response = await fetch(`${apiBase}/api/v1/company`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });

        if (response.ok) {
          const result = await response.json();
          if (result.data) {
            setCompanyData(result.data);
            setSavedData(result.data);
            if (result.data.logo) {
              localStorage.setItem('company_logo', result.data.logo);
              window.dispatchEvent(new Event('company-logo-updated'));
            }
          }
        }
      } catch (err) {
        console.error('Failed to load company details:', err);
      }
    };

    fetchCompanyData();
  }, []);

  const handleFieldChange = (field, value) => {
    setCompanyData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  // Handle Logo image upload (Max 3MB)
  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file (PNG/JPG)', 'warning');
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      showToast('Logo file size must be less than 3MB', 'warning');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      handleFieldChange('logo', reader.result);
      showToast('Logo attached for upload', 'success');
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    handleFieldChange('logo', '');
    if (logoInputRef.current) {
      logoInputRef.current.value = '';
    }
  };

  // Handle Signature image upload (Max 3MB)
  const handleSignatureUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file (PNG/JPG)', 'warning');
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      showToast('Signature file size must be less than 3MB', 'warning');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      handleFieldChange('signature', reader.result);
      showToast('Signature attached for upload', 'success');
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveSignature = () => {
    handleFieldChange('signature', '');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCancelEdit = () => {
    setCompanyData(savedData);
    setErrors({});
    setIsEditing(false);
    showToast('Editing cancelled, changes discarded', 'info');
  };

  const handleSave = async (e) => {
    e.preventDefault();

    try {
      await companyDetailsSchema.validate(companyData, { abortEarly: false });
      setErrors({});
    } catch (validationErr) {
      const fieldErrors = {};
      validationErr.inner.forEach((err) => {
        if (!fieldErrors[err.path]) {
          fieldErrors[err.path] = err.message;
        }
      });
      setErrors(fieldErrors);
      showToast(validationErr.inner[0]?.message || 'Please fill required fields properly', 'warning');
      return;
    }

    setIsLoading(true);

    try {
      const apiBase = import.meta.env.VITE_API_BASE_URL || '';
      const response = await fetch(`${apiBase}/api/v1/company`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(companyData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to save company details');
      }

      setSavedData(result.data || companyData);
      setCompanyData(result.data || companyData);
      const savedLogo = result.data?.logo || companyData.logo;
      if (savedLogo) {
        localStorage.setItem('company_logo', savedLogo);
        window.dispatchEvent(new Event('company-logo-updated'));
      }
      setIsEditing(false);
      showToast(result.message || 'Company details saved successfully!', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to save company details', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-7 shadow-sm">
      {/* Card Header */}
      <div className="flex items-center justify-between pb-4 mb-6 border-b border-gray-100">
        <h2 className="text-[17px] font-bold text-[#212B36]">
          Company Information
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

      {/* Form Fields Grid */}
      <form onSubmit={handleSave} className="space-y-4.5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
          {/* 1. Company Name (Required) */}
          <Input
            id="company-name"
            name="companyName"
            type="text"
            label="Company Name"
            value={companyData.companyName}
            onChange={(e) => handleFieldChange('companyName', e.target.value)}
            placeholder="Enter company name"
            required
            disabled={!isEditing}
            error={errors.companyName}
            leftIcon={FiBriefcase}
          />

          {/* 2. GSTIN Number (Optional) */}
          <Input
            id="company-gstin"
            name="gstin"
            type="text"
            label="GSTIN Number (Optional)"
            value={companyData.gstin}
            onChange={(e) => handleFieldChange('gstin', e.target.value)}
            placeholder="Enter GSTIN number"
            disabled={!isEditing}
            error={errors.gstin}
            leftIcon={FiFileText}
          />

          {/* 3. Mobile Number (Required) */}
          <Input
            id="company-mobile"
            name="mobile"
            type="text"
            label="Mobile Number"
            value={companyData.mobile}
            onChange={(e) => handleFieldChange('mobile', e.target.value)}
            placeholder="Enter mobile number"
            required
            disabled={!isEditing}
            error={errors.mobile}
            leftIcon={FiPhone}
          />

          {/* 4. Email Address (Required) */}
          <Input
            id="company-email"
            name="email"
            type="email"
            label="Email Address"
            value={companyData.email}
            onChange={(e) => handleFieldChange('email', e.target.value)}
            placeholder="Enter email address"
            required
            disabled={!isEditing}
            error={errors.email}
            leftIcon={FiMail}
          />
        </div>

        {/* 5. Company Full Address (Required) */}
        <div className="space-y-1.5">
          <label
            htmlFor="company-address"
            className="text-[13px] font-semibold text-[#212B36] flex items-center justify-between"
          >
            <span>
              Company Full Address <span className="text-red-500">*</span>
            </span>
          </label>

          <div className="relative">
            <div className="absolute top-3.5 left-4 text-[#646B72]">
              <FiMapPin className="text-[17px]" />
            </div>
            <textarea
              id="company-address"
              rows={3}
              value={companyData.address}
              onChange={(e) => handleFieldChange('address', e.target.value)}
              placeholder="Enter company address"
              disabled={!isEditing}
              className={`w-full pl-11 pr-4 py-3 bg-[#F7F7F7] border rounded-2xl text-[14px] font-medium text-[#212B36] placeholder-[#646B72]/60 outline-none transition-all duration-200 resize-none
                ${
                  errors.address
                    ? 'border-red-400 focus:border-red-500 focus:ring-4 focus:ring-red-100'
                    : 'border-gray-100 hover:border-gray-200 focus:border-[#FE9F43] focus:bg-white focus:ring-4 focus:ring-[#FE9F43]/15'
                }
                ${!isEditing ? 'opacity-75 cursor-not-allowed bg-gray-50' : 'bg-[#F7F7F7]'}
              `}
            />
          </div>

          {errors.address && (
            <p className="text-[12px] font-medium text-red-500">
              {errors.address}
            </p>
          )}
        </div>

        {/* 6. Upload Section: Company Logo and Digital Signature Side-by-Side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 pt-1">
          {/* Field 6A: Company Logo */}
          <div className="space-y-2">
            <label className="text-[13px] font-semibold text-[#212B36] flex items-center justify-between">
              <span>
                Company Logo <span className="text-red-500">*</span>
              </span>
              {companyData.logo && (
                <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Logo Attached
                </span>
              )}
            </label>

            <input
              ref={logoInputRef}
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              disabled={!isEditing}
              className="hidden"
              id="logo-file-input"
            />

            {/* Logo Box */}
            <div
              className={`border-2 border-dashed rounded-2xl p-4 transition-all text-center flex flex-col items-center justify-center min-h-[140px] ${
                errors.logo
                  ? 'border-red-300 bg-red-50/20'
                  : 'border-gray-200 bg-[#F7F7F7]'
              } ${isEditing ? 'hover:border-[#FE9F43]/60 cursor-pointer' : 'cursor-not-allowed opacity-85'}`}
              onClick={() => {
                if (isEditing && !companyData.logo) {
                  logoInputRef.current?.click();
                }
              }}
            >
              {companyData.logo ? (
                <div className="flex flex-col items-center gap-2.5">
                  <div className="bg-white p-2 rounded-xl border border-gray-200 shadow-2xs max-w-[180px]">
                    <img
                      src={companyData.logo}
                      alt="Company Logo"
                      className="max-h-18 object-contain mx-auto"
                    />
                  </div>
                  {isEditing && (
                    <div className="flex items-center gap-2 mt-1">
                      <button
                        type="button"
                        onClick={() => logoInputRef.current?.click()}
                        className="px-2.5 py-1 rounded-lg text-[11.5px] font-bold text-[#FE9F43] bg-[#FFF5EC] border border-[#FFE7D3] hover:bg-[#ffe8d4] transition-colors cursor-pointer"
                      >
                        Change Logo
                      </button>
                      <button
                        type="button"
                        onClick={handleRemoveLogo}
                        className="px-2.5 py-1 rounded-lg text-[11.5px] font-bold text-red-600 bg-red-50 border border-red-200 hover:bg-red-100 transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <FiTrash2 className="text-[12px]" />
                        <span>Remove</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center gap-1.5 py-2">
                  <div className="w-10 h-10 rounded-full bg-[#FFF5EC] border border-[#FFE7D3] flex items-center justify-center text-[#FE9F43]">
                    <FiImage className="text-[18px]" />
                  </div>
                  <div>
                    <p className="text-[13px] font-bold text-[#212B36]">
                      {isEditing
                        ? 'Click to browse & upload logo'
                        : 'No logo uploaded yet'}
                    </p>
                    <p className="text-[11.5px] text-[#646B72]">
                      Supports PNG or JPG (Max 3MB)
                    </p>
                  </div>
                </div>
              )}
            </div>

            {errors.logo && (
              <p className="text-[12px] font-medium text-red-500">
                {errors.logo}
              </p>
            )}
          </div>

          {/* Field 6B: Authorized Signatory (Digital Signature) */}
          <div className="space-y-2">
            <label className="text-[13px] font-semibold text-[#212B36] flex items-center justify-between">
              <span>
                Authorized Signatory (Digital Signature){' '}
                <span className="text-red-500">*</span>
              </span>
              {companyData.signature && (
                <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Signature Attached
                </span>
              )}
            </label>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleSignatureUpload}
              disabled={!isEditing}
              className="hidden"
              id="signature-file-input"
            />

            {/* Signature Box */}
            <div
              className={`border-2 border-dashed rounded-2xl p-4 transition-all text-center flex flex-col items-center justify-center min-h-[140px] ${
                errors.signature
                  ? 'border-red-300 bg-red-50/20'
                  : 'border-gray-200 bg-[#F7F7F7]'
              } ${isEditing ? 'hover:border-[#FE9F43]/60 cursor-pointer' : 'cursor-not-allowed opacity-85'}`}
              onClick={() => {
                if (isEditing && !companyData.signature) {
                  fileInputRef.current?.click();
                }
              }}
            >
              {companyData.signature ? (
                <div className="flex flex-col items-center gap-2.5">
                  <div className="bg-white p-2 rounded-xl border border-gray-200 shadow-2xs max-w-[180px]">
                    <img
                      src={companyData.signature}
                      alt="Authorized Signature"
                      className="max-h-18 object-contain mx-auto"
                    />
                  </div>
                  {isEditing && (
                    <div className="flex items-center gap-2 mt-1">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-2.5 py-1 rounded-lg text-[11.5px] font-bold text-[#FE9F43] bg-[#FFF5EC] border border-[#FFE7D3] hover:bg-[#ffe8d4] transition-colors cursor-pointer"
                      >
                        Change Signature
                      </button>
                      <button
                        type="button"
                        onClick={handleRemoveSignature}
                        className="px-2.5 py-1 rounded-lg text-[11.5px] font-bold text-red-600 bg-red-50 border border-red-200 hover:bg-red-100 transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <FiTrash2 className="text-[12px]" />
                        <span>Remove</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center gap-1.5 py-2">
                  <div className="w-10 h-10 rounded-full bg-[#FFF5EC] border border-[#FFE7D3] flex items-center justify-center text-[#FE9F43]">
                    <FiUploadCloud className="text-[18px]" />
                  </div>
                  <div>
                    <p className="text-[13px] font-bold text-[#212B36]">
                      {isEditing
                        ? 'Click to browse & upload signature'
                        : 'No signature uploaded yet'}
                    </p>
                    <p className="text-[11.5px] text-[#646B72]">
                      Supports PNG or JPG (Max 3MB)
                    </p>
                  </div>
                </div>
              )}
            </div>

            {errors.signature && (
              <p className="text-[12px] font-medium text-red-500">
                {errors.signature}
              </p>
            )}
          </div>
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
