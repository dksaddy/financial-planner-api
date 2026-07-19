import AppError from "../utils/AppError.js";
import { verifyToken } from "../utils/jwt.js";
import * as userRepository from "../repositories/user.repository.js";
import { HTTP_STATUS } from "../constants/httpStatus.js";
import { AUTH_MESSAGES } from "../constants/messages.js";

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      throw new AppError(
        AUTH_MESSAGES.AUTH_REQUIRED,
        HTTP_STATUS.UNAUTHORIZED
      );
    }

    const token = authHeader.split(" ")[1];

    const decoded = verifyToken(token);

    const user = await userRepository.findById(decoded.id);

    if (!user) {
      throw new AppError(
        AUTH_MESSAGES.USER_NOT_FOUND,
        HTTP_STATUS.UNAUTHORIZED
      );
    }

    req.user = user;

    next();
  } catch (error) {
    // JWT errors only
    if (
      error.name === "JsonWebTokenError" ||
      error.name === "TokenExpiredError"
    ) {
      return next(
        new AppError(
          AUTH_MESSAGES.INVALID_TOKEN,
          HTTP_STATUS.UNAUTHORIZED
        )
      );
    }

    next(error);
  }
};

export default authenticate;