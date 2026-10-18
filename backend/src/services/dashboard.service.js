import * as dashboardRepo from '../repositories/dashboard.repository.js';

export const getDashboardSummary = async ({ period = '1W', startDate = null, endDate = null } = {}) => {
  return await dashboardRepo.getDashboardSummary({ period, startDate, endDate });
};
