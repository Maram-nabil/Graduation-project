import { Router } from "express";
import { protectedRoutes, allowedTo } from "../../middleware/auth.js";
import {
  getPersonalized,
  adminListOffers,
  adminCreateOffer,
  adminUpdateOffer,
  adminDeleteOffer
} from "./offer.controller.js";

export const offerRouter = Router();

// User: personalized offers (authenticated; :userId should match req.user._id)
offerRouter.get("/personalized/:userId", protectedRoutes, getPersonalized);

// Admin CRUD
const adminRouter = Router();
adminRouter.use(protectedRoutes, allowedTo("admin"));
adminRouter.get("/", adminListOffers);
adminRouter.post("/", adminCreateOffer);
adminRouter.put("/:id", adminUpdateOffer);
adminRouter.delete("/:id", adminDeleteOffer);

export const adminOffersRouter = adminRouter;
