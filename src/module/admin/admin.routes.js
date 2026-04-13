import { Router } from "express";
import { allowedTo, protectedRoutes } from "../../middleware/auth.js";
import {
  blockUser,
  getStats,
  getUser,
  getUsers,
  listCategories,
  listItems,
  listOffers,
  listTransactions,
  removeUser
} from "./admin.controller.js";

export const adminRouter = Router();

const adminGuard = [protectedRoutes, allowedTo("admin")];

adminRouter.get("/stats", ...adminGuard, getStats);
adminRouter.get("/users", ...adminGuard, getUsers);
adminRouter.get("/users/:id", ...adminGuard, getUser);
adminRouter.put("/users/:id/block", ...adminGuard, blockUser);
adminRouter.delete("/users/:id", ...adminGuard, removeUser);
adminRouter.get("/categories", ...adminGuard, listCategories);
adminRouter.get("/items", ...adminGuard, listItems);
adminRouter.get("/transactions", ...adminGuard, listTransactions);
adminRouter.get("/offers", ...adminGuard, listOffers);
