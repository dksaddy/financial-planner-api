import AppError from "../utils/AppError.js";
import { HTTP_STATUS } from "../constants/httpStatus.js";
import * as userRepository from "../repositories/user.repository.js";

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