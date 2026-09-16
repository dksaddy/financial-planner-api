import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import { HTTP_STATUS } from "../constants/httpStatus.js";
import { AUTH_MESSAGES } from "../constants/messages.js";
import { env } from "../config/env.js";

// Applies to login/register: 5 attempts per 15 minutes per IP.
// Deliberately stricter than a general API limiter since these
// endpoints are the main brute-force / credential-stuffing target.
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 5,
  standardHeaders: true, // return RateLimit-* headers
  legacyHeaders: false,

  // Same reasoning as passwordConfirmLimiter below: the suite logs in through
  // `tests/helpers/auth.helper.js` in nearly every test, all from one address,
  // and a 15-minute window outlives the whole run. Without this the sixth login
  // and everything after it gets a 429 whose body has no `data`, and the suite
  // fails on `response.body.data.token` rather than on anything it tests.
  skip: () => env.nodeEnv === "test",

 handler: (req, res) => {
    res.status(HTTP_STATUS.TOO_MANY_REQUESTS).json({
      success: false,
      statusCode: HTTP_STATUS.TOO_MANY_REQUESTS,
      message: "Too many attempts. Please try again later.",
    });
  },
});

// Every endpoint that asks for the password again is a place to guess it, so
// the saving-plan mutations get a limiter of their own.
//
// Two differences from authLimiter. It keys on the user id rather than the IP,
// since these routes run behind `authenticate`: that follows one account
// across networks, and stops one person on a shared address from exhausting
// everyone else's budget.
//
// And it counts a wrong password and nothing else. `skipSuccessfulRequests`
// alone would count every non-2xx, which here includes ordinary refusals a
// working session produces — a deposit over the cap, a plan that is already
// withdrawn, a stale id. Ten of those in 15 minutes is a normal afternoon, and
// locking the account out of its own saving plans for getting a business rule
// wrong would be a worse bug than the one this middleware exists to prevent.
// Redefining "successful" as "not a 403" leaves only `assertPassword`'s
// rejection on the meter.
export const passwordConfirmLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 10,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,

  requestWasSuccessful: (req, res) =>
    res.statusCode !== HTTP_STATUS.FORBIDDEN,

  // The suite deliberately sends wrong passwords to prove each action refuses
  // them, and a 15-minute window outlives the whole run — so counting there
  // would turn a later test's 403 into a 429 and fail it for the wrong reason.
  // Every test shares one seeded user, so there is no per-test budget to give.
  skip: () => env.nodeEnv === "test",

  // These routes sit behind `authenticate`, so the id is always there in
  // practice. The IP fallback is for safety if that ever stops being true, and
  // goes through `ipKeyGenerator` because a raw IPv6 address would otherwise
  // give every address in a client's /64 its own budget.
  keyGenerator: (req) =>
    req.user?.id ? String(req.user.id) : ipKeyGenerator(req.ip),

  handler: (req, res) => {
    res.status(HTTP_STATUS.TOO_MANY_REQUESTS).json({
      success: false,
      statusCode: HTTP_STATUS.TOO_MANY_REQUESTS,
      message: AUTH_MESSAGES.TOO_MANY_PASSWORD_ATTEMPTS,
    });
  },
});