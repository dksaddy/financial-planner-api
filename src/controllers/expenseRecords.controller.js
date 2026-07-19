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

    const records = await getAllExpenseRecords(req.user.id);

    res.json(
        new ApiResponse(
            200,
            "Expense records fetched successfully",
            records
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