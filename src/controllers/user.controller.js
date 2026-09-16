import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import * as userService from "../services/user.service.js";
import { HTTP_STATUS } from "../constants/httpStatus.js";
import { USER_MESSAGES } from "../constants/messages.js";
import { uploadAvatar } from "../services/user.service.js";
import { changePassword } from "../services/user.service.js";

export const getProfile =
  asyncHandler(async (req, res) => {

    return res.status(HTTP_STATUS.OK).json(
      new ApiResponse(
        HTTP_STATUS.OK,
        USER_MESSAGES.PROFILE_FETCHED,
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

    return res.status(HTTP_STATUS.OK).json(
      new ApiResponse(
        HTTP_STATUS.OK,
        USER_MESSAGES.PROFILE_UPDATED,
        user
      )
    );

  });

  export const updateAvatar = asyncHandler(async (req, res) => {
  const user = await uploadAvatar(
    req.user.id,
    req.file
  );

  return res.status(HTTP_STATUS.OK).json(
    new ApiResponse(
      HTTP_STATUS.OK,
      USER_MESSAGES.AVATAR_UPDATED,
      user
    )
  );
});


export const getAvatars = asyncHandler(async (req, res) => {
  const avatars = await userService.listAvatars(req.user.id);

  return res.status(HTTP_STATUS.OK).json(
    new ApiResponse(
      HTTP_STATUS.OK,
      USER_MESSAGES.AVATARS_FETCHED,
      avatars
    )
  );
});

export const selectAvatar = asyncHandler(async (req, res) => {
  const user = await userService.selectAvatar(
    req.user.id,
    req.body.name
  );

  return res.status(HTTP_STATUS.OK).json(
    new ApiResponse(
      HTTP_STATUS.OK,
      USER_MESSAGES.AVATAR_SELECTED,
      user
    )
  );
});

export const deleteAvatar = asyncHandler(async (req, res) => {
  const removed = await userService.deleteAvatar(
    req.user.id,
    req.params.fileName
  );

  return res.status(HTTP_STATUS.OK).json(
    new ApiResponse(
      HTTP_STATUS.OK,
      USER_MESSAGES.AVATAR_DELETED,
      removed
    )
  );
});

export const updatePassword =
  asyncHandler(async (req, res) => {

    await changePassword(
      req.user.id,
      req.body
    );

    return res.status(HTTP_STATUS.OK).json(
      new ApiResponse(
        HTTP_STATUS.OK,
        USER_MESSAGES.PASSWORD_UPDATED
      )
    );

  });

