import * as numberingService from '../services/numbering.service.js';

export const getNumbering = async (req, res, next) => {
  try {
    const numbering = await numberingService.fetchNumbering();
    res.status(200).json({
      success: true,
      data: numbering,
    });
  } catch (err) {
    next(err);
  }
};

export const saveNumbering = async (req, res, next) => {
  try {
    const saved = await numberingService.saveNumbering(req.body);
    res.status(200).json({
      success: true,
      message: 'Invoice numbering configuration saved successfully!',
      data: saved,
    });
  } catch (err) {
    next(err);
  }
};

export const resetSequence = async (req, res, next) => {
  try {
    const reset = await numberingService.resetSequence();
    res.status(200).json({
      success: true,
      message: 'Sequence counter reset to 0001 successfully!',
      data: reset,
    });
  } catch (err) {
    next(err);
  }
};
