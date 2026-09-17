import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import { HTTP_STATUS } from "../constants/httpStatus.js";
import { EXPENSE_RECORD_MESSAGES } from "../constants/messages.js";

import {
    createExpenseRecord,
    getAllExpenseRecords,
    getExpenseRecordById,
    updateExpenseRecord,
    deleteExpenseRecord,
} from "../services/expenseRecords.service.js";

export const create = asyncHandler(async (req,res)=>{

    const record = await createExpenseRecord(
        req.user,
        req.body
    );

    res.status(HTTP_STATUS.CREATED).json(
        new ApiResponse(
            HTTP_STATUS.CREATED,
            EXPENSE_RECORD_MESSAGES.CREATED,
            record
        )
    );

});

export const getAll = asyncHandler(async(req,res)=>{

    // validateQuery puts the coerced values here — Express 5's req.query
    // is read-only, so it cannot be replaced in place.
    const { page, limit, month } = req.validatedQuery;

    const result = await getAllExpenseRecords(
        req.user.id,
        { page, limit, month }
    );

    res.json(
        new ApiResponse(
            HTTP_STATUS.OK,
            EXPENSE_RECORD_MESSAGES.FETCHED,
            result.records,
            {
                pagination: result.pagination,
                summary: result.summary,
                months: result.months,
                extraSavings: result.extraSavings,
            }
        )
    );

});

export const getById = asyncHandler(async(req,res)=>{

    const record = await getExpenseRecordById(
        req.params.id,
        req.user.id
    );

    res.json(
        new ApiResponse(
            HTTP_STATUS.OK,
            EXPENSE_RECORD_MESSAGES.FETCHED_ONE,
            record
        )
    );

});

export const update = asyncHandler(async(req,res)=>{

    const record = await updateExpenseRecord(
        req.params.id,
        req.user,
        req.body
    );

    res.json(
        new ApiResponse(
            HTTP_STATUS.OK,
            EXPENSE_RECORD_MESSAGES.UPDATED,
            record
        )
    );

});

export const remove = asyncHandler(async(req,res)=>{

    await deleteExpenseRecord(
        req.params.id,
        req.user.id
    );

    res.json(
        new ApiResponse(
            HTTP_STATUS.OK,
            EXPENSE_RECORD_MESSAGES.DELETED
        )
    );

});