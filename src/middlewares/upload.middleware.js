import multer from "multer";
import AppError from "../utils/AppError.js";
import { HTTP_STATUS } from "../constants/httpStatus.js";
import { UPLOAD_MESSAGES } from "../constants/messages.js";
import { IMAGE_TYPES } from "../constants/limits.js";

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

// One multer per size limit, kept because building it is not free and the two
// routes that upload hit theirs on every request. A limit is a constant, so
// this map never holds more than a couple of entries.
const uploads = new Map();

const uploadFor = (maxMb) => {
  if (!uploads.has(maxMb)) {
    uploads.set(
      maxMb,
      multer({
        storage,
        fileFilter,
        limits: {
          fileSize: maxMb * 1024 * 1024,
        },
      })
    );
  }

  return uploads.get(maxMb);
};

// Same shape as multer's own `upload.single(field)`, plus the size limit the
// route accepts. There is no default: the two uploads differ, and a third
// should have to say what it takes rather than inherit a figure chosen for
// something else. A file over the limit reaches us as a MulterError, which is
// not an AppError and would otherwise answer a generic 500; it becomes a 400
// naming the limit that route enforces instead.
const single = (field, maxMb) => {
  const handler = uploadFor(maxMb).single(field);

  return (req, res, next) => {
    handler(req, res, (error) => {
      if (error?.code === "LIMIT_FILE_SIZE") {
        return next(
          new AppError(
            UPLOAD_MESSAGES.TOO_LARGE(maxMb),
            HTTP_STATUS.BAD_REQUEST
          )
        );
      }

      next(error);
    });
  };
};

export default { single };
