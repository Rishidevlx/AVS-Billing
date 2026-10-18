import * as bankService from '../services/bank.service.js';

export const getBank = async (req, res, next) => {
  try {
    const bank = await bankService.fetchBank();
    res.status(200).json({
      success: true,
      data: bank,
    });
  } catch (err) {
    next(err);
  }
};

export const saveBank = async (req, res, next) => {
  try {
    const saved = await bankService.saveBank(req.body);
    res.status(200).json({
      success: true,
      message: 'Bank account details saved successfully!',
      data: saved,
    });
  } catch (err) {
    next(err);
  }
};
