import { supabase } from "../config/supabase.js";
import { v4 as uuid } from "uuid";
import * as userRepository from "../repositories/user.repository.js";
import AppError from "../utils/AppError.js";
import { HTTP_STATUS } from "../constants/httpStatus.js";

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