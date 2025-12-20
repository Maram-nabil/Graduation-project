import { Router } from "express";
import { protectedRoutes } from "../../middleware/auth.js";
import {createItem,getMyItems,getItemById,updateItem,deleteItem} from "./items.controller.js";

export const itemsRouter = Router();

itemsRouter.post('/',protectedRoutes,createItem);

itemsRouter.get('/',protectedRoutes,getMyItems);

itemsRouter.get('/:id',protectedRoutes,getItemById);
 
itemsRouter.put('/:id',protectedRoutes,updateItem);

itemsRouter.delete('/:id',protectedRoutes,deleteItem);
