import { Router } from "express";
import { getOffersHandler } from "./offer.controller.js";

export const offersRouter = Router();

offersRouter.get("/", getOffersHandler);