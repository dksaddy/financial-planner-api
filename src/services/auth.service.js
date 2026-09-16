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

  // Signed in straight away: the response carries the same session a login
  // would, so the client never has to ask for the password twice.
  return createSession(user);
};

const createSession = (user) => {
  const token = generateToken({
    id: user.id,
    email: user.email,
  });

  return {
    token,
    // The client caches this user in a cookie and renders from it until the
    // profile is fetched, so it carries the display fields too — otherwise an
    // avatar only appears after a visit to the profile page.
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      salary: user.salary,
      working_days_per_month: user.working_days_per_month,
      working_days_per_week: user.working_days_per_week,
      avatar_url: user.avatar_url,
    },
  };
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

  return createSession(user);
};

// Step-up check for actions that ask the signed-in user to confirm with their
// password. Throws on failure and returns nothing, so a caller cannot mistake
// a falsy result for a pass — `await assertPassword(...)` then act.
//
// FORBIDDEN, not UNAUTHORIZED: the token is valid and the session stays alive,
// it is this one action that is refused. The web client logs out on any 401 it
// did not expect, and a mistyped confirmation must not end the session.
export const assertPassword = async (userId, password) => {
  const user = await userRepository.findByIdWithPassword(userId);

  if (!user) {
    throw new AppError(
      AUTH_MESSAGES.USER_NOT_FOUND,
      HTTP_STATUS.NOT_FOUND
    );
  }

  const isPasswordMatched = await bcrypt.compare(
    password,
    user.password
  );

  if (!isPasswordMatched) {
    throw new AppError(
      AUTH_MESSAGES.PASSWORD_INCORRECT,
      HTTP_STATUS.FORBIDDEN
    );
  }
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