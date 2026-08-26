import rateLimit from "express-rate-limit";
import { HTTP_STATUS } from "../constants/httpStatus.js";

// Applies to login/register: 10 attempts per 15 minutes per IP.
// Deliberately stricter than a general API limiter since these
// endpoints are the main brute-force / credential-stuffing target.
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 5,
  standardHeaders: true, // return RateLimit-* headers
  legacyHeaders: false,

 handler: (req, res) => {
    res.status(HTTP_STATUS.TOO_MANY_REQUESTS).json({
      success: false,
      statusCode: HTTP_STATUS.TOO_MANY_REQUESTS,
      message: "Too many attempts. Please try again later.",
    });
  },
});