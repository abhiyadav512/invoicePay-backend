const validateRequest = (schema) => (req, res, next) => {
  try {
    req.body = schema.parse(req.body); // validated & parsed
    next();
  } catch (err) {
    // console.log('error form valid ', err);
    return res.status(400).json({
      success: false,
      message: err?.message || 'Validation failed',
      errors: err.errors
    });
  }
};

module.exports = validateRequest;
