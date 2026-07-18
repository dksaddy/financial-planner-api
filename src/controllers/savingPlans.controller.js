import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import { HTTP_STATUS } from "../constants/httpStatus.js";
import {
  createSavingPlan,
  getAllSavingPlans,
  getSavingPlanById,
  updateSavingPlan,
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
      "Saving plan created successfully",
      savingPlan
    )
  );
});

export const getAll = asyncHandler(async (req, res) => {
  const plans = await getAllSavingPlans(req.user.id);

  return res.status(200).json(
    new ApiResponse(
      200,
      "Saving plans fetched successfully",
      plans
    )
  );
});

export const getById = asyncHandler(async (req, res) => {
  const plan = await getSavingPlanById(
    req.params.id,
    req.user.id
  );

  return res.status(200).json(
    new ApiResponse(
      200,
      "Saving plan fetched successfully",
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

  return res.status(200).json(
    new ApiResponse(
      200,
      "Saving plan updated successfully",
      plan
    )
  );
});

export const remove = asyncHandler(async (req, res) => {
  await deleteSavingPlan(
    req.params.id,
    req.user.id
  );

  return res.status(200).json(
    new ApiResponse(
      200,
      "Saving plan deleted successfully"
    )
  );
});

