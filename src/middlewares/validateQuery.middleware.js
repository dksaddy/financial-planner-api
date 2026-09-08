// Same contract as validate.middleware.js, but for the query string.
//
// Express 5 exposes `req.query` as a getter with no setter, so the parsed
// (and coerced) values are attached to `req.validatedQuery` instead —
// controllers must read that, not `req.query`, for validated endpoints.
const validateQuery = (schema) => {
  return (req, res, next) => {
    const result = schema.safeParse(req.query);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: result.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      });
    }

    req.validatedQuery = result.data;

    next();
  };
};

export default validateQuery;
