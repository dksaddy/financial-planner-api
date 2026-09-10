import { supabase } from "../config/supabase.js";
import { v4 as uuid } from "uuid";
import * as userRepository from "../repositories/user.repository.js";
import AppError from "../utils/AppError.js";
import { HTTP_STATUS } from "../constants/httpStatus.js";
import bcrypt from "bcrypt";

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
      "Email already exists",
      HTTP_STATUS.CONFLICT
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
      "Avatar image is required.",
      HTTP_STATUS.BAD_REQUEST
    );
  }

  const extension = file.originalname.split(".").pop();

  const fileName = `${userId}/${uuid()}.${extension}`;

  const { error } = await supabase.storage
    .from(process.env.SUPABASE_BUCKET)
    .upload(fileName, file.buffer, {
      contentType: file.mimetype,
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

  return await userRepository.updateAvatar(
    userId,
    data.publicUrl
  );
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
      "Invalid image.",
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

export const deleteAvatar = async (userId, fileName) => {
  const path = resolveAvatarPath(userId, fileName);

  const user = await userRepository.findById(userId);

  if (user?.avatar_url === buildPublicUrl(path)) {
    throw new AppError(
      "This is your current profile picture. Upload a new photo before deleting it.",
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
      "Image not found.",
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
      "Old password is incorrect.",
      HTTP_STATUS.BAD_REQUEST
    );
  }

  const hashedPassword =
    await bcrypt.hash(newPassword, 10);

  await userRepository.updatePassword(
    userId,
    hashedPassword
  );

  return;
};