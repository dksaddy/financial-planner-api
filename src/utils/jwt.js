import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import { JWT_CONFIG } from "../config/jwt.js";

export const generateToken = (payload) => {
  return jwt.sign(
    {
      ...payload,
      jti: uuidv4(),
      // `iat` is whole seconds, too coarse to tell a token issued just before
      // a password change from the one issued just after it. See
      // `issuedAtMs` below and `auth.middleware.js`.
      iat_ms: Date.now(),
    },
    JWT_CONFIG.secret,
    {
      expiresIn: JWT_CONFIG.expiresIn,
    }
  );
};

export const verifyToken = (token) => {
  return jwt.verify(token, JWT_CONFIG.secret);
};

// When a token was issued, in milliseconds. Tokens signed before `iat_ms`
// existed fall back to `iat`, rounded down — which can only make them look
// older, never newer, so a password change still ends them.
export const issuedAtMs = (decoded) =>
  decoded.iat_ms ?? decoded.iat * 1000;
