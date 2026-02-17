import { AppError } from "../../utils/AppError.js";
import { catchError } from "../../utils/catchError.js";
import { Offer } from "../../DB/models/offer.model.js";
import { getPersonalizedOffers } from "./offer.service.js";

/**
 * GET /offers/personalized/:userId
 * Returns personalized offers based on user's top spending category (expense).
 * Caller must be authenticated; optionally restrict to own userId (req.user._id).
 */
export const getPersonalized = catchError(async (req, res, next) => {
  const { userId } = req.params;
  // Optional: ensure user can only request their own personalized offers
  if (req.user && String(req.user._id) !== String(userId)) {
    return next(new AppError("You can only request your own personalized offers", 403));
  }
  const data = await getPersonalizedOffers(userId);
  res.status(200).json({
    message: "Personalized offers retrieved successfully",
    data
  });
});

// ----- Admin -----

/**
 * GET /admin/offers
 */
export const adminListOffers = catchError(async (req, res, next) => {
  const { isActive, category } = req.query;
  const filter = {};
  if (isActive !== undefined) filter.isActive = isActive === "true";
  if (category) filter.category = category;
  const offers = await Offer.find(filter)
    .populate("category", "name color")
    .sort({ createdAt: -1 })
    .lean();
  res.status(200).json({
    message: "Offers retrieved successfully",
    count: offers.length,
    data: offers
  });
});

/**
 * POST /admin/offers
 */
export const adminCreateOffer = catchError(async (req, res, next) => {
  const {
    platformName,
    category,
    title,
    discountPercentage,
    imageUrl,
    redirectUrl,
    validUntil,
    isActive
  } = req.body;
  if (!platformName || !category || !title || discountPercentage == null || !validUntil) {
    return next(
      new AppError(
        "platformName, category, title, discountPercentage, and validUntil are required",
        400
      )
    );
  }
  const offer = await Offer.create({
    platformName,
    category,
    title,
    discountPercentage: Number(discountPercentage),
    imageUrl: imageUrl || undefined,
    redirectUrl: redirectUrl || undefined,
    validUntil: new Date(validUntil),
    isActive: isActive !== false
  });
  const populated = await Offer.findById(offer._id).populate("category", "name color").lean();
  res.status(201).json({
    message: "Offer created successfully",
    data: populated
  });
});

/**
 * PUT /admin/offers/:id
 */
export const adminUpdateOffer = catchError(async (req, res, next) => {
  const { id } = req.params;
  const allowed = [
    "platformName",
    "category",
    "title",
    "discountPercentage",
    "imageUrl",
    "redirectUrl",
    "validUntil",
    "isActive"
  ];
  const updates = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) updates[key] = req.body[key];
  }
  if (updates.validUntil) updates.validUntil = new Date(updates.validUntil);
  const offer = await Offer.findByIdAndUpdate(id, updates, {
    new: true,
    runValidators: true
  }).populate("category", "name color");

  if (!offer) return next(new AppError("Offer not found", 404));
  res.status(200).json({
    message: "Offer updated successfully",
    data: offer
  });
});

/**
 * DELETE /admin/offers/:id
 */
export const adminDeleteOffer = catchError(async (req, res, next) => {
  const { id } = req.params;
  const offer = await Offer.findByIdAndDelete(id);
  if (!offer) return next(new AppError("Offer not found", 404));
  res.status(200).json({
    message: "Offer deleted successfully",
    data: offer
  });
});
