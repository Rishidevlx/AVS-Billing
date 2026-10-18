import React, { useState } from 'react';
import { Tabs } from '../../components/ui';
import CompanyDetailsTab from './components/CompanyDetailsTab';
import BankAccountTab from './components/BankAccountTab';
import NumberingTab from './components/NumberingTab';

export default function SystemSettings() {
  const [activeTab, setActiveTab] = useState('company'); // 'company' | 'bank' | 'numbering'

  // Tab definitions matching UI
  const settingsTabs = [
    { id: 'company', label: 'Company Details' },
    { id: 'bank', label: 'Bank Account' },
    { id: 'numbering', label: 'Numbering' },
  ];

  return (
    <div className="space-y-6 w-full max-w-4xl select-none">
      {/* Page Title & Subtitle */}
      <div>
        <h1 className="text-[24px] font-bold text-[#212B36] tracking-tight">
          System Settings
        </h1>
        <p className="text-[13.5px] font-medium text-[#646B72] mt-1">
          Manage your organization profile, bank accounts, and invoice numbering preferences.
        </p>
      </div>

      {/* Global Underline Tabs Navigation */}
      <Tabs
        tabs={settingsTabs}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {/* Tab 1: Company Details */}
      {activeTab === 'company' && <CompanyDetailsTab />}

      {/* Tab 2: Bank Account Details */}
      {activeTab === 'bank' && <BankAccountTab />}

      {/* Tab 3: Invoice Numbering Configuration */}
      {activeTab === 'numbering' && <NumberingTab />}
    </div>
  );
}
