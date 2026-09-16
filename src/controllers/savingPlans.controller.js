import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import { HTTP_STATUS } from "../constants/httpStatus.js";
import { SAVING_PLAN_MESSAGES } from "../constants/messages.js";
import { SAVING_PLAN_STATUS } from "../constants/status.js";
import {
  createSavingPlan,
  getAllSavingPlans,
  getSavingPlanById,
  updateSavingPlan,
  setSavingPlanStatus,
  depositToSavingPlan,
  deleteSavingPlan,
} from "../services/savingPlans.service.js";

export const create = asyncHandler(async (req, res) => {
  const savingPlan = await createSavingPlan(
    req.user.id,
    req.body
  );

  return res.status(HTTP_STATUS.CREATED).json(
    new ApiResponse(
      HTTP_STATUS.CREATED,
      SAVING_PLAN_MESSAGES.CREATED,
      savingPlan
    )
  );
});

export const getAll = asyncHandler(async (req, res) => {
  const plans = await getAllSavingPlans(req.user.id);

  return res.status(HTTP_STATUS.OK).json(
    new ApiResponse(
      HTTP_STATUS.OK,
      SAVING_PLAN_MESSAGES.FETCHED,
      plans
    )
  );
});

export const getById = asyncHandler(async (req, res) => {
  const plan = await getSavingPlanById(
    req.params.id,
    req.user.id
  );

  return res.status(HTTP_STATUS.OK).json(
    new ApiResponse(
      HTTP_STATUS.OK,
      SAVING_PLAN_MESSAGES.FETCHED_ONE,
      plan
    )
  );
});

export const update = asyncHandler(async (req, res) => {
  const plan = await updateSavingPlan(
    req.params.id,
    req.user.id,
    req.body
  );

  return res.status(HTTP_STATUS.OK).json(
    new ApiResponse(
      HTTP_STATUS.OK,
      SAVING_PLAN_MESSAGES.UPDATED,
      plan
    )
  );
});

export const updateStatus = asyncHandler(async (req, res) => {
  const plan = await setSavingPlanStatus(
    req.params.id,
    req.user.id,
    req.body.status,
    req.body.password
  );

  return res.status(HTTP_STATUS.OK).json(
    new ApiResponse(
      HTTP_STATUS.OK,
      // Keyed off the stored status rather than the requested one, so the
      // message can only ever describe what the plan actually is. No fallback:
      // `messages.js` refuses to load while any status lacks a line.
      SAVING_PLAN_MESSAGES.STATUS_CHANGED[plan.status],
      plan
    )
  );
});

export const deposit = asyncHandler(async (req, res) => {
  const plan = await depositToSavingPlan(
    req.params.id,
    req.user.id,
    req.body.amount,
    req.body.password
  );

  return res.status(HTTP_STATUS.OK).json(
    new ApiResponse(
      HTTP_STATUS.OK,
      // A deposit that fills the plan completes it in the same statement, so
      // this is the one place the caller learns the plan is done.
      plan.status === SAVING_PLAN_STATUS.COMPLETED
        ? SAVING_PLAN_MESSAGES.DEPOSIT_COMPLETED
        : SAVING_PLAN_MESSAGES.DEPOSIT_ADDED,
      plan
    )
  );
});

export const remove = asyncHandler(async (req, res) => {
  await deleteSavingPlan(
    req.params.id,
    req.user.id,
    req.body.password
  );

  return res.status(HTTP_STATUS.OK).json(
    new ApiResponse(
      HTTP_STATUS.OK,
      SAVING_PLAN_MESSAGES.DELETED
    )
  );
});
