import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import * as userService from "../services/user.service.js";
import { HTTP_STATUS } from "../constants/httpStatus.js";
import { uploadAvatar } from "../services/user.service.js";
import { changePassword } from "../services/user.service.js";

export const getProfile =
  asyncHandler(async (req, res) => {

    return res.status(200).json(
      new ApiResponse(
        HTTP_STATUS.OK,
        "Profile fetched successfully",
        req.user
      )
    );

  });

export const updateProfile =
  asyncHandler(async (req, res) => {

    const user =
      await userService.updateProfile(
        req.user.id,
        req.body
      );

    return res.status(200).json(
      new ApiResponse(
        HTTP_STATUS.OK,
        "Profile updated successfully",
        user
      )
    );

  });

  export const updateAvatar = asyncHandler(async (req, res) => {
  const user = await uploadAvatar(
    req.user.id,
    req.file
  );

  return res.status(200).json(
    new ApiResponse(
      HTTP_STATUS.OK,
      "Avatar updated successfully",
      user
    )
  );
});


export const updatePassword =
  asyncHandler(async (req, res) => {

    await changePassword(
      req.user.id,
      req.body
    );

    return res.status(200).json(
      new ApiResponse(
        HTTP_STATUS.OK,
        "Password updated successfully"
      )
    );

  });

