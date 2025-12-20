import express from "express";
import { uploadSingleFile } from "../../middleware/fileUpload.js";
import { protectedRoutes } from "../../middleware/auth.js";
import { analyzeText, analyzeVoice } from "./AI.controller.js";

const AIrouter = express.Router();

// Text analysis
AIrouter.post("/voice",protectedRoutes , uploadSingleFile('voice_path', 'voice', 'audio'), analyzeVoice);

// Voice analysis
AIrouter.post("/analyze", protectedRoutes , uploadSingleFile('OCR_path', 'OCR', 'image'), analyzeText);

export default AIrouter;