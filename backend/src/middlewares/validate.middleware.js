export const validate = (schema) => (req, res, next) => {
  try {
    schema.parse(req.body);
    next();
  } catch (err) {
    if (err.errors && err.errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: err.errors[0].message,
      });
    }
    return res.status(400).json({
      success: false,
      message: 'Invalid request data',
    });
  }
};
