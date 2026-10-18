import * as companyService from '../services/company.service.js';

export const getCompany = async (req, res, next) => {
  try {
    const company = await companyService.fetchCompany();
    res.status(200).json({
      success: true,
      data: company,
    });
  } catch (err) {
    next(err);
  }
};

export const saveCompany = async (req, res, next) => {
  try {
    const saved = await companyService.saveCompany(req.body);
    res.status(200).json({
      success: true,
      message: 'Company details and images saved successfully!',
      data: saved,
    });
  } catch (err) {
    next(err);
  }
};
