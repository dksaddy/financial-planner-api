import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";

import {
    createExpenseRecord,
    getAllExpenseRecords,
    getExpenseRecordById,
    updateExpenseRecord,
    deleteExpenseRecord,
} from "../services/expenseRecords.service.js";

export const create = asyncHandler(async (req,res)=>{

    const record = await createExpenseRecord(
        req.user.id,
        req.body
    );

    res.status(201).json(
        new ApiResponse(
            201,
            "Expense record created successfully",
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
            200,
            "Expense records fetched successfully",
            result.records,
            {
                pagination: result.pagination,
                summary: result.summary,
                months: result.months,
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
            200,
            "Expense record fetched successfully",
            record
        )
    );

});

export const update = asyncHandler(async(req,res)=>{

    const record = await updateExpenseRecord(
        req.params.id,
        req.user.id,
        req.body
    );

    res.json(
        new ApiResponse(
            200,
            "Expense record updated successfully",
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
            200,
            "Expense record deleted successfully"
        )
    );

});