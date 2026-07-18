import AppError from "../utils/AppError.js";
import { verifyToken } from "../utils/jwt.js";
import { findUserById } from "../repositories/auth.repository.js";
import { HTTP_STATUS } from "../constants/httpStatus.js";

const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(
      new AppError(
        "Authentication required",
        HTTP_STATUS.UNAUTHORIZED
      )
    );
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = verifyToken(token);

    const user = await findUserById(decoded.id);

    if (!user) {
      return next(
        new AppError(
          "User not found",
          HTTP_STATUS.UNAUTHORIZED
        )
      );
    }

    req.user = user;

    next();
  } catch {
    next(
      new AppError(
        "Invalid or expired token",
        HTTP_STATUS.UNAUTHORIZED
      )
    );
  }
};

export default authenticate;