import sharp from "sharp";

import AppError from "./AppError.js";
import { HTTP_STATUS } from "../constants/httpStatus.js";

// A target picture is never shown above ~450px wide (the add-target preview);
// the cards and thumbnails are far smaller. 1024 leaves room for a retina
// screen and still throws away the bulk of a phone photo.
const MAX_DIMENSION = 1024;

// WebP at this quality keeps a photo of that size near 30-80KB — comfortably
// inside the ~100KB budget of ten images per megabyte. Raising it costs size
// steeply for detail no card is large enough to show.
const QUALITY = 70;

// Animation is the one thing WebP-from-GIF handles badly here: sharp needs
// `animated: true` on the way in or it silently keeps only the first frame.
const isAnimated = (mimetype) => mimetype === "image/gif";

const EXTENSIONS = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

/**
 * Shrinks an uploaded image to something worth storing.
 *
 * Returns the encoded buffer alongside the content type and extension it
 * should be stored under — the output is always WebP, so the caller must not
 * reuse the original file's extension.
 */
export const compressImage = async (file) => {
  const animated = isAnimated(file.mimetype);

  try {
    const buffer = await sharp(file.buffer, { animated })
      .rotate() // Honour the EXIF orientation before it is stripped below.
      .resize({
        width: MAX_DIMENSION,
        height: MAX_DIMENSION,
        fit: "inside",
        // Never upscale: a small image would only get heavier.
        withoutEnlargement: true,
      })
      .webp({ quality: QUALITY, effort: 4 })
      .toBuffer();

    // An image already smaller than the re-encode — a tiny icon, or a PNG of
    // flat colour that WebP cannot beat — is stored untouched. Compressing is
    // meant to save space, so it must never cost any.
    if (buffer.length >= file.buffer.length) {
      return {
        buffer: file.buffer,
        contentType: file.mimetype,
        extension: EXTENSIONS[file.mimetype] ?? "img",
      };
    }

    return {
      buffer,
      contentType: "image/webp",
      extension: "webp",
    };
  } catch (error) {
    // sharp throws on a file that passed the mimetype filter but is not
    // actually decodable — a renamed .txt, say, or a truncated upload.
    throw new AppError(
      "That image could not be processed. Try another file.",
      HTTP_STATUS.BAD_REQUEST
    );
  }
};
