import bcrypt from "bcrypt";
import AppError from "../utils/AppError.js";
import { generateToken } from "../utils/jwt.js";
import { HTTP_STATUS } from "../constants/httpStatus.js";
import { AUTH_MESSAGES } from "../constants/messages.js";
import * as userRepository from "../repositories/user.repository.js";
import * as tokenDenylistRepository from "../repositories/tokenDenylist.repository.js";

export const registerUser = async ({ name, email, password }) => {
  const existingUser = await userRepository.findByEmail(email);

  if (existingUser) {
    throw new AppError(
      AUTH_MESSAGES.EMAIL_EXISTS,
      HTTP_STATUS.CONFLICT
    );
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await userRepository.create({
    name,
    email,
    password: hashedPassword,
  });

  return user;
};

export const loginUser = async ({ email, password }) => {
  const user = await userRepository.findByEmail(email);

  if (!user) {
    throw new AppError(
      AUTH_MESSAGES.INVALID_CREDENTIALS,
      HTTP_STATUS.UNAUTHORIZED
    );
  }

  const isPasswordMatched = await bcrypt.compare(
    password,
    user.password
  );

  if (!isPasswordMatched) {
    throw new AppError(
      AUTH_MESSAGES.INVALID_CREDENTIALS,
      HTTP_STATUS.UNAUTHORIZED
    );
  }

  const token = generateToken({
    id: user.id,
    email: user.email,
  });

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
  };
};

export const getCurrentUser = async (userId) => {
  const user = await userRepository.findById(userId);

  if (!user) {
    throw new AppError(
      AUTH_MESSAGES.USER_NOT_FOUND,
      HTTP_STATUS.NOT_FOUND
    );
  }

  return user;
};

export const logoutUser = async (decodedToken) => {
  const { jti, id: userId, exp } = decodedToken;

  // exp is in seconds (JWT standard); convert to a JS Date for storage.
  const expiresAt = new Date(exp * 1000);

  await tokenDenylistRepository.revoke({
    jti,
    userId,
    expiresAt,
  });
};