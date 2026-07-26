import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import { HTTP_STATUS } from "../constants/httpStatus.js";
import { getDashboardData } from "../services/dashboard.service.js";

export const getDashboard = asyncHandler(async (req, res) => {
  const dashboard = await getDashboardData(req.user.id);

  return res.status(HTTP_STATUS.OK).json(
    new ApiResponse(
      HTTP_STATUS.OK,
      "Dashboard fetched successfully",
      dashboard
    )
  );
});