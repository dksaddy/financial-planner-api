import AppError from "../utils/AppError.js";
import { issuedAtMs, verifyToken } from "../utils/jwt.js";
import * as userRepository from "../repositories/user.repository.js";
import * as tokenDenylistRepository from "../repositories/tokenDenylist.repository.js";
import { HTTP_STATUS } from "../constants/httpStatus.js";
import { AUTH_MESSAGES } from "../constants/messages.js";

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      throw new AppError(AUTH_MESSAGES.AUTH_REQUIRED, HTTP_STATUS.UNAUTHORIZED);
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token);

    const [isRevoked, sessionUser] = await Promise.all([
      tokenDenylistRepository.isRevoked(decoded.jti),
      userRepository.findSessionUser(decoded.id),
    ]);

    if (isRevoked) {
      throw new AppError(AUTH_MESSAGES.INVALID_TOKEN, HTTP_STATUS.UNAUTHORIZED);
    }

    if (!sessionUser) {
      throw new AppError(
        AUTH_MESSAGES.USER_NOT_FOUND,
        HTTP_STATUS.UNAUTHORIZED,
      );
    }

    const { password_changed_at: passwordChangedAt, ...user } = sessionUser;

    // A password change ends every session opened before it — the moment a
    // user changes a password is the moment a stolen token most needs to stop
    // working. The change itself hands the caller a fresh token.
    if (
      passwordChangedAt &&
      issuedAtMs(decoded) < new Date(passwordChangedAt).getTime()
    ) {
      throw new AppError(AUTH_MESSAGES.INVALID_TOKEN, HTTP_STATUS.UNAUTHORIZED);
    }

    req.user = user;
    // Keep the decoded payload (jti, exp, etc.) around so the logout
    // controller can revoke this exact token without re-verifying it.
    req.decodedToken = decoded;

    next();
  } catch (error) {
    // JWT errors only
    if (
      error.name === "JsonWebTokenError" ||
      error.name === "TokenExpiredError"
    ) {
      return next(
        new AppError(AUTH_MESSAGES.INVALID_TOKEN, HTTP_STATUS.UNAUTHORIZED),
      );
    }

    next(error);
  }
};

export default authenticate;
