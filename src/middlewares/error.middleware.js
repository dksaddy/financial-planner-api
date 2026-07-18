import { HTTP_STATUS } from "../constants/httpStatus.js";

const errorHandler = (err, req, res, next) => {
  console.error(err);

  res.status(err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
    success: false,
    statusCode:
      err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR,
    message: err.message || "Internal Server Error",
  });
};

export default errorHandler;