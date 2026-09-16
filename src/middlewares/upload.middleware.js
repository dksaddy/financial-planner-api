import multer from "multer";
import AppError from "../utils/AppError.js";
import { HTTP_STATUS } from "../constants/httpStatus.js";
import { UPLOAD_MESSAGES } from "../constants/messages.js";
import { IMAGE_MAX_MB, IMAGE_TYPES } from "../constants/limits.js";

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (!IMAGE_TYPES.includes(file.mimetype)) {
    return cb(
      new AppError(
        UPLOAD_MESSAGES.UNSUPPORTED_TYPE,
        HTTP_STATUS.BAD_REQUEST
      ),
      false
    );
  }

  cb(null, true);
};

const multerUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: IMAGE_MAX_MB * 1024 * 1024,
  },
});

// Same shape as multer's own `upload.single(field)`, so routes are unchanged.
// A file over the size limit reaches us as a MulterError, which is not an
// AppError and would otherwise answer a generic 500; it becomes a 400 naming
// the limit instead.
const single = (field) => {
  const handler = multerUpload.single(field);

  return (req, res, next) => {
    handler(req, res, (error) => {
      if (error?.code === "LIMIT_FILE_SIZE") {
        return next(
          new AppError(
            UPLOAD_MESSAGES.TOO_LARGE(IMAGE_MAX_MB),
            HTTP_STATUS.BAD_REQUEST
          )
        );
      }

      next(error);
    });
  };
};

export default { single };
