import React, { useState, useEffect } from 'react';
import {
  FiHome,
  FiUser,
  FiCreditCard,
  FiKey,
  FiMapPin,
  FiEdit2,
  FiCheck,
} from 'react-icons/fi';
import { Input, Button } from '../../../components/ui';
import { showToast } from '../../../utils/alert';
import { bankAccountSchema } from '../../../validations/settings.validation';

export default function BankAccountTab() {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const emptyBankData = {
    bankName: '',
    accountName: '',
    accountNumber: '',
    ifscCode: '',
    branchLocation: '',
  };

  const [bankData, setBankData] = useState(emptyBankData);
  const [savedBankData, setSavedBankData] = useState(emptyBankData);
  const [errors, setErrors] = useState({});

  // Fetch existing bank details from backend on load
  useEffect(() => {
    const fetchBankData = async () => {
      try {
        const apiBase = import.meta.env.VITE_API_BASE_URL || '';
        const response = await fetch(`${apiBase}/api/v1/bank`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });

        if (response.ok) {
          const result = await response.json();
          if (result.data) {
            setBankData(result.data);
            setSavedBankData(result.data);
          }
        }
      } catch (err) {
        console.error('Failed to load bank details:', err);
      }
    };

    fetchBankData();
  }, []);

  const handleFieldChange = (field, value) => {
    let formattedVal = value;
    if (field === 'ifscCode') {
      formattedVal = value.toUpperCase();
    }
    setBankData((prev) => ({ ...prev, [field]: formattedVal }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const handleCancelEdit = () => {
    setBankData(savedBankData);
    setErrors({});
    setIsEditing(false);
    showToast('Bank details editing cancelled', 'info');
  };

  const handleSave = async (e) => {
    e.preventDefault();

    try {
      await bankAccountSchema.validate(bankData, { abortEarly: false });
      setErrors({});
    } catch (validationErr) {
      const fieldErrors = {};
      validationErr.inner.forEach((err) => {
        if (!fieldErrors[err.path]) {
          fieldErrors[err.path] = err.message;
        }
      });
      setErrors(fieldErrors);
      showToast(validationErr.inner[0]?.message || 'Please fill bank details properly', 'warning');
      return;
    }

    setIsLoading(true);

    try {
      const apiBase = import.meta.env.VITE_API_BASE_URL || '';
      const response = await fetch(`${apiBase}/api/v1/bank`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(bankData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to save bank details');
      }

      setSavedBankData(result.data || bankData);
      setBankData(result.data || bankData);
      setIsEditing(false);
      showToast(result.message || 'Bank account details saved successfully!', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to save bank details', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-7 shadow-sm">
      {/* Card Header */}
      <div className="flex items-center justify-between pb-4 mb-6 border-b border-gray-100">
        <h2 className="text-[17px] font-bold text-[#212B36]">
          Bank Account Information
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

      {/* Bank Form Fields Grid */}
      <form onSubmit={handleSave} className="space-y-4.5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
          {/* 1. Bank Name (Required) */}
          <Input
            id="bank-name"
            name="bankName"
            type="text"
            label="Bank Name"
            value={bankData.bankName}
            onChange={(e) => handleFieldChange('bankName', e.target.value)}
            placeholder="Enter bank name (e.g. State Bank of India)"
            required
            disabled={!isEditing}
            error={errors.bankName}
            leftIcon={FiHome}
          />

          {/* 2. Account Name (Required) */}
          <Input
            id="bank-account-name"
            name="accountName"
            type="text"
            label="Account Name"
            value={bankData.accountName}
            onChange={(e) => handleFieldChange('accountName', e.target.value)}
            placeholder="Enter account holder name"
            required
            disabled={!isEditing}
            error={errors.accountName}
            leftIcon={FiUser}
          />

          {/* 3. Account Number (Required) */}
          <Input
            id="bank-account-number"
            name="accountNumber"
            type="text"
            label="Account Number"
            value={bankData.accountNumber}
            onChange={(e) => handleFieldChange('accountNumber', e.target.value)}
            placeholder="Enter account number"
            required
            disabled={!isEditing}
            error={errors.accountNumber}
            leftIcon={FiCreditCard}
          />

          {/* 4. IFSC Code (Required) */}
          <Input
            id="bank-ifsc-code"
            name="ifscCode"
            type="text"
            label="IFSC Code"
            value={bankData.ifscCode}
            onChange={(e) => handleFieldChange('ifscCode', e.target.value)}
            placeholder="Enter IFSC code (e.g. SBIN0001234)"
            required
            disabled={!isEditing}
            error={errors.ifscCode}
            leftIcon={FiKey}
          />

          {/* 5. Branch Location (Required - regular input, NOT textarea) */}
          <div className="md:col-span-2">
            <Input
              id="bank-branch-location"
              name="branchLocation"
              type="text"
              label="Branch Location"
              value={bankData.branchLocation}
              onChange={(e) => handleFieldChange('branchLocation', e.target.value)}
              placeholder="Enter branch location / city"
              required
              disabled={!isEditing}
              error={errors.branchLocation}
              leftIcon={FiMapPin}
            />
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
