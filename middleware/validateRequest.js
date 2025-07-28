const validateRequest = (schema) => (req, res, next) => {
  try {
    req.body = schema.parse(req.body); // validated & parsed
    next();
  } catch (err) {
    // console.log('Validation error:', err);

    // Handle Zod validation errors - send first error message
    if (err.name === 'ZodError') {
      const firstError = err.issues[0];
      return res.status(400).json({
        success: false,
        message: firstError.message
      });
    }

    // Handle other errors
    return res.status(400).json({
      success: false,
      message: err.message || 'Validation failed'
    });
  }
};

module.exports = { validateRequest };
