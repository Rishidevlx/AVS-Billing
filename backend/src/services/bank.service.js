import * as bankRepository from '../repositories/bank.repository.js';

export const fetchBank = async () => {
  const row = await bankRepository.getBankDetails();
  if (!row) return null;

  return {
    id: row.id,
    bankName: row.bank_name,
    accountName: row.account_name,
    accountNumber: row.account_number,
    ifscCode: row.ifsc_code,
    branchLocation: row.branch_location,
    updatedAt: row.updated_at,
  };
};

export const saveBank = async (data) => {
  const { bankName, accountName, accountNumber, ifscCode, branchLocation } = data;

  if (!bankName || !accountName || !accountNumber || !ifscCode || !branchLocation) {
    const error = new Error('All bank account fields are required');
    error.statusCode = 400;
    throw error;
  }

  const saved = await bankRepository.upsertBankDetails({
    bankName: bankName.trim(),
    accountName: accountName.trim(),
    accountNumber: accountNumber.trim(),
    ifscCode: ifscCode.trim().toUpperCase(),
    branchLocation: branchLocation.trim(),
  });

  return saved;
};
