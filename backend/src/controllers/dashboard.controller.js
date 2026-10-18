import * as dashboardService from '../services/dashboard.service.js';

export const getDashboardSummary = async (req, res) => {
  try {
    const { period = '1W', startDate, endDate } = req.query;
    const summary = await dashboardService.getDashboardSummary({
      period,
      startDate: startDate || null,
      endDate: endDate || null,
    });
    return res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message || 'Failed to fetch dashboard summary',
    });
  }
};
