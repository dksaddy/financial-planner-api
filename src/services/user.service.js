import { supabase } from "../config/supabase.js";
import { v4 as uuid } from "uuid";
import * as userRepository from "../repositories/user.repository.js";
import AppError from "../utils/AppError.js";
import { HTTP_STATUS } from "../constants/httpStatus.js";
import {
  AUTH_MESSAGES,
  USER_MESSAGES,
} from "../constants/messages.js";
import bcrypt from "bcrypt";
import { AVATAR_MAX } from "../constants/limits.js";
import { compressImage } from "../utils/image.js";
import { withUserLock } from "../db/query.js";
import { createSession } from "./auth.service.js";

// An avatar is never drawn above 128px; 256 covers a retina screen.
const AVATAR_MAX_DIMENSION = 256;

// A week cannot hold more working days than its month. The update may carry
// only one of the two, so the other side is the stored figure. The users
// table's check constraint repeats the rule; this answers 400 instead of the
// 500 a violated constraint would reach the client as.
const assertWorkingDaysFit = async (userId, body) => {
  if (
    body.working_days_per_month === undefined &&
    body.working_days_per_week === undefined
  ) {
    return;
  }

  const user = await userRepository.findById(userId);

  const perMonth =
    body.working_days_per_month ?? user.working_days_per_month;

  const perWeek =
    body.working_days_per_week ?? user.working_days_per_week;

  if (perWeek > perMonth) {
    throw new AppError(
      USER_MESSAGES.WORKING_DAYS_WEEK_EXCEEDS_MONTH,
      HTTP_STATUS.BAD_REQUEST
    );
  }
};

export const updateProfile = async (
  userId,
  body
) => {

  const exists =
    await userRepository.emailExists(
      body.email,
      userId
    );

  if (exists) {
    throw new AppError(
      AUTH_MESSAGES.EMAIL_EXISTS,
      HTTP_STATUS.CONFLICT
    );
  }

  await assertWorkingDaysFit(userId, body);

  if (
    body.time_zone !== undefined &&
    !(await userRepository.isKnownTimeZone(body.time_zone))
  ) {
    throw new AppError(
      USER_MESSAGES.VALIDATION.TIME_ZONE_INVALID,
      HTTP_STATUS.BAD_REQUEST
    );
  }

  return userRepository.updateProfile(
    userId,
    body
  );
};

export const uploadAvatar = async (userId, file) => {
  if (!file) {
    throw new AppError(
      USER_MESSAGES.AVATAR_REQUIRED,
      HTTP_STATUS.BAD_REQUEST
    );
  }

  // Shrunk before the lock is taken — it is the slow part and needs no lock —
  // and before the count, so an undecodable file is refused without a listing.
  const image = await compressImage(file, {
    maxDimension: AVATAR_MAX_DIMENSION,
  });

  // The album is capped. Nothing here replaces a file — every upload is a new
  // uuid — so a user at the cap deletes one before another can go in. Counted
  // before the upload, or a refused photo would still reach storage.
  //
  // Storage has no lock of its own, so the count and the upload run under the
  // user's advisory lock: two uploads at once take turns, and the second one
  // sees the first one's photo in the listing.
  return withUserLock(userId, async () => {
    const album = await listAvatars(userId);

    if (album.length >= AVATAR_MAX) {
      throw new AppError(
        USER_MESSAGES.AVATAR_LIMIT_REACHED(AVATAR_MAX),
        HTTP_STATUS.BAD_REQUEST
      );
    }

    const fileName = `${userId}/${uuid()}.${image.extension}`;

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

    return await userRepository.updateAvatar(
      userId,
      buildPublicUrl(fileName)
    );
  });
};

// Every upload lands in `${userId}/<uuid>.<ext>` and nothing overwrites or
// removes the previous file, so the user's storage folder already *is* the
// album. Storage is its only source of truth — no table tracks these.
const buildPublicUrl = (path) =>
  supabase.storage
    .from(process.env.SUPABASE_BUCKET)
    .getPublicUrl(path).data.publicUrl;

// Storage has no user_id column to scope a query on, so the folder prefix is
// the entire ownership check. The client sends a bare file name and the server
// decides the folder; anything that could climb out of it is refused.
const resolveAvatarPath = (userId, fileName) => {
  const name = typeof fileName === "string" ? fileName.trim() : "";

  if (
    !name ||
    name.includes("/") ||
    name.includes("\\") ||
    name.includes("..")
  ) {
    throw new AppError(
      USER_MESSAGES.AVATAR_INVALID,
      HTTP_STATUS.BAD_REQUEST
    );
  }

  return `${userId}/${name}`;
};

export const listAvatars = async (userId) => {
  const { data, error } = await supabase.storage
    .from(process.env.SUPABASE_BUCKET)
    .list(userId, {
      limit: 100,
      sortBy: { column: "created_at", order: "desc" },
    });

  if (error) {
    throw new AppError(
      error.message,
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
  }

  const user = await userRepository.findById(userId);

  // `list` returns the `targets/` sub-folder alongside the avatars — folders
  // come back with a null id — and Supabase parks a hidden placeholder file
  // in any folder that is currently empty.
  return (data ?? [])
    .filter(
      (entry) =>
        entry.id && entry.name !== ".emptyFolderPlaceholder"
    )
    .map((entry) => {
      const url = buildPublicUrl(`${userId}/${entry.name}`);

      return {
        name: entry.name,
        url,
        created_at: entry.created_at ?? null,
        is_current: url === user?.avatar_url,
      };
    });
};

export const selectAvatar = async (userId, fileName) => {
  const path = resolveAvatarPath(userId, fileName);

  // Confirmed against the folder listing rather than trusted: a public URL can
  // be built for any name at all, so without this a deleted — or never
  // uploaded — file could be written to `avatar_url` as a broken image.
  const album = await listAvatars(userId);

  if (!album.some((photo) => photo.name === fileName.trim())) {
    throw new AppError(
      USER_MESSAGES.AVATAR_NOT_FOUND,
      HTTP_STATUS.NOT_FOUND
    );
  }

  return await userRepository.updateAvatar(
    userId,
    buildPublicUrl(path)
  );
};

export const deleteAvatar = async (userId, fileName) => {
  const path = resolveAvatarPath(userId, fileName);

  const user = await userRepository.findById(userId);

  if (user?.avatar_url === buildPublicUrl(path)) {
    throw new AppError(
      USER_MESSAGES.AVATAR_IN_USE,
      HTTP_STATUS.BAD_REQUEST
    );
  }

  const { data, error } = await supabase.storage
    .from(process.env.SUPABASE_BUCKET)
    .remove([path]);

  if (error) {
    throw new AppError(
      error.message,
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
  }

  // Removing a path that isn't there is not an error to Supabase — it just
  // reports nothing removed, which for us means the file never existed.
  if (!data?.length) {
    throw new AppError(
      USER_MESSAGES.AVATAR_NOT_FOUND,
      HTTP_STATUS.NOT_FOUND
    );
  }

  return { name: fileName };
};

export const changePassword = async (
  userId,
  {
    oldPassword,
    newPassword,
  }
) => {

  const user =
    await userRepository.findByIdWithPassword(userId);

  const isMatch =
    await bcrypt.compare(
      oldPassword,
      user.password
    );

  if (!isMatch) {
    throw new AppError(
      USER_MESSAGES.OLD_PASSWORD_INCORRECT,
      HTTP_STATUS.FORBIDDEN
    );
  }

  const hashedPassword =
    await bcrypt.hash(newPassword, 10);

  // Every token issued before this moment stops working in
  // `auth.middleware.js` — including the one this request came in on — so the
  // caller gets a new session back and stays signed in on this device only.
  const updated = await userRepository.updatePassword(
    userId,
    hashedPassword,
    new Date()
  );

  return createSession(updated);
};