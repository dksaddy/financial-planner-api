import * as targetRepository from "../repositories/targets.repository.js";
import { supabase } from "../config/supabase.js";
import { v4 as uuid } from "uuid";
import AppError from "../utils/AppError.js";
import { HTTP_STATUS } from "../constants/httpStatus.js";
import { TARGET_MESSAGES } from "../constants/messages.js";
import { TARGET_STATUS } from "../constants/status.js";
import { compressImage } from "../utils/image.js";
import { withUserLock } from "../db/query.js";
import { getTotalExtraSave } from "./extraSavings.service.js";

// Money is compared in integer cents: numeric columns arrive as strings.
const toCents = (value) => Math.round(Number(value) * 100);

// Shrunk before it is stored, never at its uploaded size. The extension comes
// from the compressor rather than the original name, because the output is
// always WebP whatever went in. Returns the public URL.
const uploadTargetImage = async (userId, file) => {
  const image = await compressImage(file);

  const fileName = `${userId}/targets/${uuid()}.${image.extension}`;

  const { error } = await supabase.storage
    .from(process.env.SUPABASE_BUCKET)
    .upload(fileName, image.buffer, {
      contentType: image.contentType,
      upsert: true,
    });

  if (error) {
    throw new AppError(
      error.message,
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
  }

  const { data } = supabase.storage
    .from(process.env.SUPABASE_BUCKET)
    .getPublicUrl(fileName);

  return data.publicUrl;
};

export const createTarget = async (
  userId,
  body,
  file
) => {

  const image_url = file
    ? await uploadTargetImage(userId, file)
    : null;

  return await targetRepository.create({
    userId,
    ...body,
    image_url,
  });

};

// Public URLs look like `<SUPABASE_URL>/storage/v1/object/public/<bucket>/<path>`.
// Only a path inside the user's own `targets/` folder is returned, so a URL
// pointing anywhere else can never cause another file to be removed.
const getTargetImagePath = (userId, imageUrl) => {
  const marker = `/object/public/${process.env.SUPABASE_BUCKET}/`;
  const index = imageUrl.indexOf(marker);

  if (index === -1) return null;

  const path = decodeURIComponent(
    imageUrl.slice(index + marker.length).split("?")[0]
  );

  if (
    !path.startsWith(`${userId}/targets/`) ||
    path.includes("..")
  ) {
    return null;
  }

  return path;
};

const removeTargetImage = async (userId, imageUrl) => {
  // Targets created while picture reuse existed can still share one file, so
  // it is only removed once no remaining target points at it.
  const stillUsed = await targetRepository.isImageInUse(
    userId,
    imageUrl
  );

  if (stillUsed) return;

  const path = getTargetImagePath(userId, imageUrl);

  if (!path) return;

  const { error } = await supabase.storage
    .from(process.env.SUPABASE_BUCKET)
    .remove([path]);

  // The target row is already gone by now, so a failed cleanup is logged
  // rather than turned into an error for a delete that did succeed.
  if (error) {
    console.error(
      `Failed to remove target image "${path}":`,
      error.message
    );
  }
};

export const getTargets = async (
  userId
) => {

  return await targetRepository.findAllByUser(
    userId
  );

};

export const getTarget = async (
  id,
  userId
) => {

  const target =
    await targetRepository.findById(
      id,
      userId
    );

  if (!target) {
    throw new AppError(
      TARGET_MESSAGES.NOT_FOUND,
      HTTP_STATUS.NOT_FOUND
    );
  }

  return target;
};

// A completed target's amount comes out of Total Extra Save, so two rules keep
// that figure honest:
//
// - completing a target needs the Extra Save to pay for it — the total cannot
//   be driven negative by marking a target done;
// - a completed target's amount is frozen, because it has already been
//   deducted. Setting it back to pending in the same request unfreezes it.
const assertTargetChangeAllowed = async (userId, existing, next) => {
  const wasCompleted = existing.status === TARGET_STATUS.COMPLETED;
  const staysCompleted = next.status === TARGET_STATUS.COMPLETED;

  if (
    wasCompleted &&
    staysCompleted &&
    toCents(next.target_amount) !== toCents(existing.target_amount)
  ) {
    throw new AppError(
      TARGET_MESSAGES.COMPLETED_AMOUNT_LOCKED,
      HTTP_STATUS.BAD_REQUEST
    );
  }

  if (!wasCompleted && staysCompleted) {
    // This target is still pending, so the total does not count it yet.
    const { totalExtraSave } = await getTotalExtraSave(userId);

    if (toCents(next.target_amount) > toCents(totalExtraSave)) {
      throw new AppError(
        TARGET_MESSAGES.INSUFFICIENT_EXTRA_SAVE(
          Math.max(totalExtraSave, 0).toFixed(2)
        ),
        HTTP_STATUS.BAD_REQUEST
      );
    }
  }
};

export const updateTarget = async (
  id,
  userId,
  body,
  file
) => {

  const { remove_image: removeImage, ...fields } = body;

  if (file && removeImage) {
    throw new AppError(
      TARGET_MESSAGES.IMAGE_CONFLICT,
      HTTP_STATUS.BAD_REQUEST
    );
  }

  // Under the user's lock, so the Extra Save read for a completion cannot be
  // spent by another completion — or moved by an expense record, which takes
  // the same lock — between the check and the write.
  const { target, replacedImageUrl } = await withUserLock(
    userId,
    async () => {
      const existing =
        await targetRepository.findById(
          id,
          userId
        );

      if (!existing) {
        throw new AppError(
          TARGET_MESSAGES.NOT_FOUND,
          HTTP_STATUS.NOT_FOUND
        );
      }

      const next = {
        ...existing,
        ...fields,
      };

      await assertTargetChangeAllowed(userId, existing, next);

      if (file) {
        next.image_url = await uploadTargetImage(userId, file);
      } else if (removeImage) {
        next.image_url = null;
      }

      const updated = await targetRepository.update(
        id,
        userId,
        next
      );

      return {
        target: updated,
        replacedImageUrl:
          existing.image_url && existing.image_url !== next.image_url
            ? existing.image_url
            : null,
      };
    }
  );

  // After the transaction has committed, so the row no longer points at the
  // old picture when `removeTargetImage` asks whether anything still does.
  if (replacedImageUrl) {
    await removeTargetImage(userId, replacedImageUrl);
  }

  return target;

};

export const deleteTarget = async (
  id,
  userId
) => {

  const existing =
    await targetRepository.findById(
      id,
      userId
    );

  if (!existing) {
    throw new AppError(
      TARGET_MESSAGES.NOT_FOUND,
      HTTP_STATUS.NOT_FOUND
    );
  }

  await targetRepository.remove(
    id,
    userId
  );

  if (existing.image_url) {
    await removeTargetImage(
      userId,
      existing.image_url
    );
  }

};