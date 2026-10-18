import React, { useState } from 'react';
import * as yup from 'yup';
import {
  FiLock,
  FiEye,
  FiEyeOff,
  FiKey,
  FiCheckCircle,
  FiShield,
} from 'react-icons/fi';
import { Input, Button } from '../../components/ui';
import { showToast } from '../../utils/alert';

// Yup validation schema for password change
const passwordSchema = yup.object().shape({
  currentPassword: yup
    .string()
    .trim()
    .required('Current password is required'),
  newPassword: yup
    .string()
    .required('New password is required')
    .min(6, 'New password must be at least 6 characters')
    .notOneOf(
      [yup.ref('currentPassword')],
      'New password cannot be the same as current password'
    ),
  confirmPassword: yup
    .string()
    .required('Please confirm your new password')
    .oneOf([yup.ref('newPassword')], 'New password and confirm password must match'),
});

export default function ProfileSettings() {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  // Password visibility toggles
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear field-specific error as user types
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate using Yup schema
    try {
      await passwordSchema.validate(formData, { abortEarly: false });
      setErrors({});
    } catch (validationError) {
      const fieldErrors = {};
      validationError.inner.forEach((err) => {
        if (!fieldErrors[err.path]) {
          fieldErrors[err.path] = err.message;
        }
      });
      setErrors(fieldErrors);
      showToast(validationError.inner[0]?.message || 'Please fill required fields properly', 'warning');
      return;
    }

    setIsLoading(true);

    try {
      const apiBase = import.meta.env.VITE_API_BASE_URL || '';
      const response = await fetch(`${apiBase}/api/v1/auth/change-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update password');
      }

      showToast(data.message || 'Password updated successfully!', 'success');

      // Reset form
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setErrors({});
    } catch (err) {
      showToast(err.message || 'Failed to update password', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
    setErrors({});
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-[24px] font-bold text-[#212B36] tracking-tight">
          Profile Settings
        </h1>
        <p className="text-[13.5px] font-medium text-[#646B72] mt-1">
          Manage your account credentials and update your login password.
        </p>
      </div>

      {/* Centered / Compact Form Card (Width optimized to max-w-xl) */}
      <div className="max-w-xl">
        <div className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8 shadow-sm">
          {/* Card Header (Clean title without icon box and subtext) */}
          <div className="pb-4 mb-5 border-b border-gray-100">
            <h2 className="text-[17px] font-bold text-[#212B36]">
              Change Password
            </h2>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4.5">
            {/* Current Password */}
            <Input
              id="current-password"
              name="currentPassword"
              type={showCurrent ? 'text' : 'password'}
              label="Current Password"
              value={formData.currentPassword}
              onChange={(e) => handleChange('currentPassword', e.target.value)}
              placeholder="Enter current password"
              required
              error={errors.currentPassword}
              leftIcon={FiLock}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="text-[#646B72] hover:text-[#212B36] transition-colors cursor-pointer"
                  aria-label={showCurrent ? 'Hide password' : 'Show password'}
                >
                  {showCurrent ? (
                    <FiEyeOff className="text-[17px]" />
                  ) : (
                    <FiEye className="text-[17px]" />
                  )}
                </button>
              }
            />

            {/* New Password */}
            <Input
              id="new-password"
              name="newPassword"
              type={showNew ? 'text' : 'password'}
              label="New Password"
              value={formData.newPassword}
              onChange={(e) => handleChange('newPassword', e.target.value)}
              placeholder="Enter new password (min. 6 characters)"
              required
              error={errors.newPassword}
              leftIcon={FiKey}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="text-[#646B72] hover:text-[#212B36] transition-colors cursor-pointer"
                  aria-label={showNew ? 'Hide password' : 'Show password'}
                >
                  {showNew ? (
                    <FiEyeOff className="text-[17px]" />
                  ) : (
                    <FiEye className="text-[17px]" />
                  )}
                </button>
              }
            />

            {/* Confirm New Password */}
            <Input
              id="confirm-password"
              name="confirmPassword"
              type={showConfirm ? 'text' : 'password'}
              label="Confirm New Password"
              value={formData.confirmPassword}
              onChange={(e) => handleChange('confirmPassword', e.target.value)}
              placeholder="Re-enter new password"
              required
              error={errors.confirmPassword}
              leftIcon={FiShield}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="text-[#646B72] hover:text-[#212B36] transition-colors cursor-pointer"
                  aria-label={showConfirm ? 'Hide password' : 'Show password'}
                >
                  {showConfirm ? (
                    <FiEyeOff className="text-[17px]" />
                  ) : (
                    <FiEye className="text-[17px]" />
                  )}
                </button>
              }
            />

            {/* Action Buttons */}
            <div className="pt-3 flex items-center justify-end gap-3">
              <Button
                type="button"
                variant="cancel"
                onClick={handleReset}
                disabled={isLoading}
              >
                Cancel
              </Button>

              <Button
                type="submit"
                variant="primary"
                loading={isLoading}
                rightIcon={FiCheckCircle}
              >
                Update Password
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
