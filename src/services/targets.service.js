import * as targetRepository from "../repositories/targets.repository.js";
import { supabase } from "../config/supabase.js";
import { v4 as uuid } from "uuid";
import AppError from "../utils/AppError.js";
import { HTTP_STATUS } from "../constants/httpStatus.js";
import { TARGET_MESSAGES } from "../constants/messages.js";
import { compressImage } from "../utils/image.js";

export const createTarget = async (
  userId,
  body,
  file
) => {

  let image_url = null;

  if (file) {
    // Shrunk before it is stored, never at its uploaded size. The extension
    // comes from the compressor rather than the original name, because the
    // output is always WebP whatever went in.
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

    image_url = data.publicUrl;
  }

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

export const updateTarget = async (
  id,
  userId,
  body
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

  return await targetRepository.update(
    id,
    userId,
    {
      ...existing,
      ...body,
    }
  );

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