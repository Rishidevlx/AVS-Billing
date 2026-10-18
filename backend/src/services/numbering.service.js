import * as numberingRepository from '../repositories/numbering.repository.js';

export const fetchNumbering = async () => {
  const row = await numberingRepository.getNumberingSettings();
  if (!row) {
    return {
      invoicePrefix: '',
      currentSequence: 1,
    };
  }

  return {
    id: row.id,
    invoicePrefix: row.invoice_prefix || '',
    currentSequence: row.current_sequence,
    updatedAt: row.updated_at,
  };
};

export const saveNumbering = async (data) => {
  const { invoicePrefix, currentSequence } = data;

  if (!invoicePrefix || !invoicePrefix.trim()) {
    const error = new Error('Invoice prefix is required');
    error.statusCode = 400;
    throw error;
  }

  const prefix = invoicePrefix.trim().toUpperCase().slice(0, 5);

  const saved = await numberingRepository.upsertNumberingSettings({
    invoicePrefix: prefix,
    currentSequence: currentSequence !== undefined ? Number(currentSequence) : undefined,
  });

  return saved;
};

export const resetSequence = async () => {
  const reset = await numberingRepository.resetSequence();
  return reset;
};
