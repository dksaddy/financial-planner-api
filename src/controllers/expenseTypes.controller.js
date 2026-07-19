import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";

import {
  createExpenseType,
  getAllExpenseTypes,
  getExpenseTypeById,
  updateExpenseType,
  deleteExpenseType,
} from "../services/expenseTypes.service.js";

export const create = asyncHandler(async (req, res) => {
  const expenseType = await createExpenseType(req.user.id, req.body);

  res.status(201).json(
    new ApiResponse(201, "Expense type created successfully", expenseType)
  );
});

export const getAll = asyncHandler(async (req, res) => {
  const expenseTypes = await getAllExpenseTypes(req.user.id);

  res.json(
    new ApiResponse(200, "Expense types fetched successfully", expenseTypes)
  );
});

export const getById = asyncHandler(async (req, res) => {
  const expenseType = await getExpenseTypeById(
    req.params.id,
    req.user.id
  );

  res.json(
    new ApiResponse(200, "Expense type fetched successfully", expenseType)
  );
});

export const update = asyncHandler(async (req, res) => {
  const expenseType = await updateExpenseType(
    req.params.id,
    req.user.id,
    req.body
  );

  res.json(
    new ApiResponse(200, "Expense type updated successfully", expenseType)
  );
});

export const remove = asyncHandler(async (req, res) => {
  await deleteExpenseType(req.params.id, req.user.id);

  res.json(
    new ApiResponse(200, "Expense type deleted successfully")
  );
});