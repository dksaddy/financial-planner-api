import AppError from "../utils/AppError.js";
import { HTTP_STATUS } from "../constants/httpStatus.js";
import { COMMON_MESSAGES } from "../constants/messages.js";

const notFound = (req, res, next) => {
  next(
    new AppError(
      COMMON_MESSAGES.ROUTE_NOT_FOUND(req.originalUrl),
      HTTP_STATUS.NOT_FOUND
    )
  );
};

export default notFound;
