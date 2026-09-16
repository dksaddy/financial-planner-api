import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import { HTTP_STATUS } from "../constants/httpStatus.js";
import { EXPENSE_TYPE_MESSAGES } from "../constants/messages.js";
import {
  EXPENSE_TYPE_STATUS_FILTER,
  expenseTypeStatusOf,
} from "../constants/status.js";

import {
  createExpenseType,
  getAllExpenseTypes,
  getExpenseTypeById,
  updateExpenseType,
  deleteExpenseType,
  setExpenseTypeStatus,
} from "../services/expenseTypes.service.js";

export const create = asyncHandler(async (req, res) => {
  const expenseType = await createExpenseType(req.user.id, req.body);

  res.status(HTTP_STATUS.CREATED).json(
    new ApiResponse(
      HTTP_STATUS.CREATED,
      EXPENSE_TYPE_MESSAGES.CREATED,
      expenseType
    )
  );
});

export const getAll = asyncHandler(async (req, res) => {
  const expenseTypes = await getAllExpenseTypes(
    req.user.id,
    req.query.status ?? EXPENSE_TYPE_STATUS_FILTER.ALL
  );

  res.json(
    new ApiResponse(
      HTTP_STATUS.OK,
      EXPENSE_TYPE_MESSAGES.FETCHED,
      expenseTypes
    )
  );
});

export const getById = asyncHandler(async (req, res) => {
  const expenseType = await getExpenseTypeById(
    req.params.id,
    req.user.id
  );

  res.json(
    new ApiResponse(
      HTTP_STATUS.OK,
      EXPENSE_TYPE_MESSAGES.FETCHED_ONE,
      expenseType
    )
  );
});

export const update = asyncHandler(async (req, res) => {
  const expenseType = await updateExpenseType(
    req.params.id,
    req.user.id,
    req.body
  );

  res.json(
    new ApiResponse(
      HTTP_STATUS.OK,
      EXPENSE_TYPE_MESSAGES.UPDATED,
      expenseType
    )
  );
});

export const updateStatus = asyncHandler(async (req, res) => {
  const expenseType = await setExpenseTypeStatus(
    req.params.id,
    req.user.id,
    req.body.is_active
  );

  res.json(
    new ApiResponse(
      HTTP_STATUS.OK,
      // Keyed off the stored flag rather than the requested one, so the
      // message can only describe what the type actually is now.
      EXPENSE_TYPE_MESSAGES.STATUS_CHANGED[
        expenseTypeStatusOf(expenseType.is_active)
      ],
      expenseType
    )
  );
});

export const remove = asyncHandler(async (req, res) => {
  const expenseType = await deleteExpenseType(
    req.params.id,
    req.user.id
  );

  res.json(
    new ApiResponse(
      HTTP_STATUS.OK,
      EXPENSE_TYPE_MESSAGES.DELETED,
      expenseType
    )
  );
});
