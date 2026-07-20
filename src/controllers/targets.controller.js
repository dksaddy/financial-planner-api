import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import * as targetService from "../services/targets.service.js";
import { HTTP_STATUS } from "../constants/httpStatus.js";
import { TARGET_MESSAGES } from "../constants/messages.js";

export const createTarget =
  asyncHandler(async (req, res) => {

    const target =
      await targetService.createTarget(
        req.user.id,
        req.body
      );

    return res.status(
      HTTP_STATUS.CREATED
    ).json(
      new ApiResponse(
        HTTP_STATUS.CREATED,
        TARGET_MESSAGES.CREATED,
        target
      )
    );

  });

export const getTargets =
  asyncHandler(async (req, res) => {

    const targets =
      await targetService.getTargets(
        req.user.id
      );

    return res.status(
      HTTP_STATUS.OK
    ).json(
      new ApiResponse(
        HTTP_STATUS.OK,
        TARGET_MESSAGES.FETCHED,
        targets
      )
    );

  });

export const getTarget =
  asyncHandler(async (req, res) => {

    const target =
      await targetService.getTarget(
        req.params.id,
        req.user.id
      );

    return res.status(
      HTTP_STATUS.OK
    ).json(
      new ApiResponse(
        HTTP_STATUS.OK,
        TARGET_MESSAGES.FETCHED_ONE,
        target
      )
    );

  });

export const updateTarget =
  asyncHandler(async (req, res) => {

    const target =
      await targetService.updateTarget(
        req.params.id,
        req.user.id,
        req.body
      );

    return res.status(
      HTTP_STATUS.OK
    ).json(
      new ApiResponse(
        HTTP_STATUS.OK,
        TARGET_MESSAGES.UPDATED,
        target
      )
    );

  });

export const deleteTarget =
  asyncHandler(async (req, res) => {

    await targetService.deleteTarget(
      req.params.id,
      req.user.id
    );

    return res.status(
      HTTP_STATUS.OK
    ).json(
      new ApiResponse(
        HTTP_STATUS.OK,
        TARGET_MESSAGES.DELETED,
        null
      )
    );

  });