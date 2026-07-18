import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import { HTTP_STATUS } from "../constants/httpStatus.js";
import { createSavingPlan } from "../services/savingPlans.service.js";

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