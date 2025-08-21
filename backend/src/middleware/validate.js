// Generic JOI validation middleware
export const validate = (schema) => (req, res, next) => {
  const payload = ["POST", "PUT", "PATCH"].includes(req.method)
    ? req.body
    : req.query;

  const { error, value } = schema.validate(payload, {
    abortEarly: false,
    stripUnknown: true,
  });
  if (error) {
    return res.status(422).json({
      message: "Validation failed",
      details: error.details.map((d) => ({
        field: d.path.join("."),
        message: d.message,
      })),
    });
  }
  // assign sanitized value back
  if (["POST", "PUT", "PATCH"].includes(req.method)) req.body = value;
  else req.query = value;
  next();
};
