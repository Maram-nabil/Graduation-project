import { Router } from "express";
import { uploadSingleFile } from "../../middleware/fileUpload.js";
import { protectedRoutes } from "../../middleware/auth.js";
import { createCategory, deleteCategory, getMyCategory } from "./category.controller.js";

export const categoryRouter = Router();

categoryRouter.post('/' , protectedRoutes,createCategory );

categoryRouter.delete('/:id' ,protectedRoutes , uploadSingleFile('voice_path', 'voice', 'audio') ,deleteCategory  );

categoryRouter.get('/' , getMyCategory );
