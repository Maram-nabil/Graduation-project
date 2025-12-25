import { Router } from "express";
import { uploadSingleFile } from "../../middleware/fileUpload.js";
import { protectedRoutes } from "../../middleware/auth.js";
import { 
    createWithOCR, 
    createWithText, 
    createWithVoice, 
    getAllData,
    getTransaction,
    updateTransaction,
    deleteTransaction,
    getMyTransactions,
    getTransactionsByCategory,
    getTransactionsByDateRange
} from "./transactions.controller.js";

export const transactionsRouter = Router();

// Create transactions
transactionsRouter.post('/createWithText', protectedRoutes, createWithText);
transactionsRouter.post('/createWithVoice', protectedRoutes, uploadSingleFile('voice_path', 'voice', ['audio']), createWithVoice);
transactionsRouter.post('/createWithOCR', protectedRoutes, uploadSingleFile('OCR_path', 'OCR', ['image']), createWithOCR);

// Read transactions
transactionsRouter.get('/', getAllData);
transactionsRouter.get('/my', protectedRoutes, getMyTransactions);
transactionsRouter.get('/category/:categoryId', protectedRoutes, getTransactionsByCategory);
transactionsRouter.get('/date-range', protectedRoutes, getTransactionsByDateRange);
transactionsRouter.get('/:id', protectedRoutes, getTransaction);

// Update & Delete
transactionsRouter.put('/:id', protectedRoutes, updateTransaction);
transactionsRouter.delete('/:id', protectedRoutes, deleteTransaction);
