import { Router } from "express";
import { uploadSingleFile } from "../../middleware/fileUpload.js";
import { protectedRoutes } from "../../middleware/auth.js";
import { createWithOCR, createWithText, createWithVoice, getAllData } from "./transactions.controller.js";

export const transactionsRouter = Router();


transactionsRouter.post('/createWithText' , protectedRoutes,createWithText );

transactionsRouter.post('/createWithVoice' ,protectedRoutes , uploadSingleFile('voice_path', 'voice', 'audio') ,createWithVoice  );

transactionsRouter.post('/createWithOCR' ,protectedRoutes , uploadSingleFile('OCR_path', 'OCR', 'image') ,createWithOCR  );

transactionsRouter.get('/' , getAllData );
