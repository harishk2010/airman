const validate = (schema) => (req, res, next) => {

  console.log(req.params,"paramsss")
  const result = schema.safeParse({
    body: req.body,
    query: req.query,
    params: req.params,
  });
  console.log(result, "validation result!!!!!!!!!!")

  if (!result.success) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: result.error.errors.map((e) => ({
        field: e.path.slice(1).join('.'),
        message: e.message,
      })),
    });
  }

  next();
};

module.exports = { validate };
