import { Category } from "../../../DB/models/category.model.js";
import { Transactions } from "../../../DB/models/transactions.model.js";
import { ApiFeature } from "../../utils/API.Feature.js";
import { AppError } from "../../utils/AppError.js";
import { catchError } from "../../utils/catchError.js";
import axios from "axios";
import { broadcastAnalysis } from "../analysis/wsServer.js";

// Create a transaction with text
export const createWithText = catchError(async (req, res, next) => {
    console.log("Received data:", req.body);

    const { text, items, price } = req.body;

    if (!text) {
        console.log("Text is required");
        return next(new AppError("Text is required", 400));
    }

    if (!items || !items.length) {
        return next(new AppError("Items array is required", 400));
    }

    const category = await Category.findOne({ items: items[0]._id });

    if (!category) {
        return next(new AppError("Category not found", 404));
    }

    const data = await Transactions.create({
        text,
        category: category._id,
        price,
        user: req.user._id,
    });

    console.log("Data saved in database:", data);

    // trigger analysis asynchronously: send the newly created transaction to FastAPI
    (async () => {
        try {
            const categories = await Category.find({ user: req.user._id }).lean();
            let items = [];
            try {
                const { Item } = await import("../../../DB/models/item.model.js");
                items = await Item.find({ user: req.user._id }).lean();
            } catch (e) { items = []; }

            const ANALYSIS_URL = process.env.ANALYSIS_URL || "http://127.0.0.1:8000/analyze";
            const payload = { user_id: String(req.user._id), transactions: [data], categories, items };
            const resp = await axios.post(ANALYSIS_URL, payload, { timeout: 20000 });
            if (resp && resp.data) broadcastAnalysis(resp.data);
        } catch (err) {
            console.error('[ANALYSIS] error sending to analysis service', err.message || err);
        }
    })();

    res.status(201).json({ message: "Transaction created successfully", data });
});

// Create a transaction with voice
export const createWithVoice = catchError(async (req, res, next) => {
    console.log("Received data:", req.body);

    if (req.file) {
        req.body.voice_path = req.file.path;
    }

    const { voice_path, items, price } = req.body;

    if (!voice_path) {
        console.log("Voice path is required");
        return next(new AppError("Voice path is required", 400));
    }

    if (!items || !items.length) {
        return next(new AppError("Items array is required", 400));
    }

    const category = await Category.findOne({ items: items[0]._id });

    if (!category) {
        return next(new AppError("Category not found", 404));
    }

    const data = await Transactions.create({
        voice_path,
        category: category._id,
        price,
        user: req.user._id,
    });

    console.log("Data saved in database:", data);

    (async () => {
        try {
            const categories = await Category.find({ user: req.user._id }).lean();
            let items = [];
            try {
                const { Item } = await import("../../../DB/models/item.model.js");
                items = await Item.find({ user: req.user._id }).lean();
            } catch (e) { items = []; }

            const ANALYSIS_URL = process.env.ANALYSIS_URL || "http://127.0.0.1:8000/analyze";
            const payload = { user_id: String(req.user._id), transactions: [data], categories, items };
            const resp = await axios.post(ANALYSIS_URL, payload, { timeout: 20000 });
            if (resp && resp.data) broadcastAnalysis(resp.data);
        } catch (err) {
            console.error('[ANALYSIS] error sending to analysis service', err.message || err);
        }
    })();

    res.status(201).json({ message: "Transaction created successfully", data });
});

// Create a transaction with OCR
export const createWithOCR = catchError(async (req, res, next) => {
    console.log("Received data:", req.body);

    if (req.file) {
        req.body.OCR_path = req.file.path;
    }

    const { OCR_path, items, price } = req.body;

    if (!OCR_path) {
        console.log("OCR path is required");
        return next(new AppError("OCR path is required", 400));
    }

    if (!items || !items.length) {
        return next(new AppError("Items array is required", 400));
    }

    const category = await Category.findOne({ items: items[0]._id });

    if (!category) {
        return next(new AppError("Category not found", 404));
    }

    const data = await Transactions.create({
        OCR_path,
        category: category._id,
        price,
        user: req.user._id,
    });

    console.log("Data saved in database:", data);

    (async () => {
        try {
            const categories = await Category.find({ user: req.user._id }).lean();
            let items = [];
            try {
                const { Item } = await import("../../../DB/models/item.model.js");
                items = await Item.find({ user: req.user._id }).lean();
            } catch (e) { items = []; }

            const ANALYSIS_URL = process.env.ANALYSIS_URL || "http://127.0.0.1:8000/analyze";
            const payload = { user_id: String(req.user._id), transactions: [data], categories, items };
            const resp = await axios.post(ANALYSIS_URL, payload, { timeout: 20000 });
            if (resp && resp.data) broadcastAnalysis(resp.data);
        } catch (err) {
            console.error('[ANALYSIS] error sending to analysis service', err.message || err);
        }
    })();

    res.status(201).json({ message: "Transaction created successfully", data });
});



// Get all transactions with API features
export const getAllData = catchError(async (req, res, next) => {
    // Instantiate the ApiFeature class


    const apiFeature = new ApiFeature(Transactions.find(), req.query);

  apiFeature
    .filter()
    .search()
    .sort()
    .select()
    .pagination();

  // Execute query - LEAN AFTER ALL MODIFICATIONS 
  const transactions = await apiFeature.mongooseQuery

  // Calculate total count after base filter (type: creation)
  const totalCount = await Transactions.countDocuments({ type: "creation" });

  // Get response details from ApiFeature
  const responseDetails = await apiFeature.getResponseDetails();

    res.status(200).json({
        message: "Data retrieved successfully",
        meta: responseDetails,
        count : totalCount,
        data: transactions
    });
});

