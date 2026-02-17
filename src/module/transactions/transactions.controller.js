import { Category } from "../../DB/models/category.model.js";
import { Transactions } from "../../DB/models/transactions.model.js";
import { ApiFeature } from "../../utils/API.Feature.js";
import { AppError } from "../../utils/AppError.js";
import { catchError } from "../../utils/catchError.js";
import { broadcastAnalysis } from "../analysis/wsServer.js";
import { getHomeAnalytics } from "../analytics/analytics.service.js";

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

    // Real-time home analytics via Node.js aggregation (no Python)
    (async () => {
        try {
            const payload = await getHomeAnalytics(req.user._id);
            broadcastAnalysis(payload);
        } catch (err) {
            console.error('[ANALYSIS] error computing home analytics', err.message || err);
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
            const payload = await getHomeAnalytics(req.user._id);
            broadcastAnalysis(payload);
        } catch (err) {
            console.error('[ANALYSIS] error computing home analytics', err.message || err);
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
            const payload = await getHomeAnalytics(req.user._id);
            broadcastAnalysis(payload);
        } catch (err) {
            console.error('[ANALYSIS] error computing home analytics', err.message || err);
        }
    })();

    res.status(201).json({ message: "Transaction created successfully", data });
});



// Get all transactions with API features
export const getAllData = catchError(async (req, res, next) => {
    const apiFeature = new ApiFeature(Transactions.find(), req.query);

    apiFeature.filter().search().sort().select().pagination();

    const transactions = await apiFeature.mongooseQuery;
    const totalCount = await Transactions.countDocuments();
    const responseDetails = await apiFeature.getResponseDetails();

    res.status(200).json({
        message: "Data retrieved successfully",
        meta: responseDetails,
        count: totalCount,
        data: transactions
    });
});

// Get single transaction
export const getTransaction = catchError(async (req, res, next) => {
    const transaction = await Transactions.findOne({
        _id: req.params.id,
        user: req.user._id
    }).populate('category');

    if (!transaction) {
        return next(new AppError("Transaction not found", 404));
    }

    res.status(200).json({ message: "Transaction retrieved successfully", data: transaction });
});

// Get my transactions
export const getMyTransactions = catchError(async (req, res, next) => {
    const apiFeature = new ApiFeature(
        Transactions.find({ user: req.user._id }).populate('category'),
        req.query
    );

    apiFeature.filter().search().sort().select().pagination();

    const transactions = await apiFeature.mongooseQuery;
    const totalCount = await Transactions.countDocuments({ user: req.user._id });
    const responseDetails = await apiFeature.getResponseDetails();

    res.status(200).json({
        message: "Transactions retrieved successfully",
        meta: responseDetails,
        count: totalCount,
        data: transactions
    });
});

// Get transactions by category
export const getTransactionsByCategory = catchError(async (req, res, next) => {
    const { categoryId } = req.params;

    const transactions = await Transactions.find({
        user: req.user._id,
        category: categoryId
    }).populate('category').sort('-createdAt');

    res.status(200).json({
        message: "Transactions retrieved successfully",
        count: transactions.length,
        data: transactions
    });
});

// Get transactions by date range
export const getTransactionsByDateRange = catchError(async (req, res, next) => {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
        return next(new AppError("Start date and end date are required", 400));
    }

    const transactions = await Transactions.find({
        user: req.user._id,
        createdAt: {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
        }
    }).populate('category').sort('-createdAt');

    const totalAmount = transactions.reduce((sum, t) => sum + (t.price || 0), 0);

    res.status(200).json({
        message: "Transactions retrieved successfully",
        count: transactions.length,
        totalAmount,
        data: transactions
    });
});

// Update transaction
export const updateTransaction = catchError(async (req, res, next) => {
    const { text, price, category } = req.body;

    const transaction = await Transactions.findOneAndUpdate(
        { _id: req.params.id, user: req.user._id },
        { text, price, category },
        { new: true }
    ).populate('category');

    if (!transaction) {
        return next(new AppError("Transaction not found", 404));
    }

    res.status(200).json({ message: "Transaction updated successfully", data: transaction });
});

// Delete transaction
export const deleteTransaction = catchError(async (req, res, next) => {
    const transaction = await Transactions.findOneAndDelete({
        _id: req.params.id,
        user: req.user._id
    });

    if (!transaction) {
        return next(new AppError("Transaction not found", 404));
    }

    res.status(200).json({ message: "Transaction deleted successfully", data: transaction });
});

