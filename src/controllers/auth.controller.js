import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import {
  loginUser,
  registerUser,
  getCurrentUser,
} from "../services/auth.service.js";
import { HTTP_STATUS } from "../constants/httpStatus.js";
import { AUTH_MESSAGES } from "../constants/messages.js";

export const register = asyncHandler(async (req, res) => {
  const user = await registerUser(req.body);

  return res.status(HTTP_STATUS.CREATED).json(
    new ApiResponse(
      HTTP_STATUS.CREATED,
      AUTH_MESSAGES.REGISTER_SUCCESS,
      user
    )
  );
});

export const login = asyncHandler(async (req, res) => {
  const data = await loginUser(req.body);

  return res.status(HTTP_STATUS.OK).json(
    new ApiResponse(
      HTTP_STATUS.OK,
      AUTH_MESSAGES.LOGIN_SUCCESS,
      data
    )
  );
});

export const me = asyncHandler(async (req, res) => {
  const user = await getCurrentUser(req.user.id);

  return res.status(HTTP_STATUS.OK).json(
    new ApiResponse(
      HTTP_STATUS.OK,
      AUTH_MESSAGES.CURRENT_USER,
      user
    )
  );
});