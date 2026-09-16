import { HTTP_STATUS } from "../constants/httpStatus.js";
import { COMMON_MESSAGES } from "../constants/messages.js";

// Same contract as validate.middleware.js, but for the query string.
//
// Express 5 exposes `req.query` as a getter with no setter, so the parsed
// (and coerced) values are attached to `req.validatedQuery` instead —
// controllers must read that, not `req.query`, for validated endpoints.
const validateQuery = (schema) => {
  return (req, res, next) => {
    const result = schema.safeParse(req.query);

    if (!result.success) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: COMMON_MESSAGES.VALIDATION_FAILED,
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
