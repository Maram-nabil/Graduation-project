/**
 * Offer service: top spending category + active offers by category.
 */
import { Offer } from "../../DB/models/offer.model.js";
import { Category } from "../../DB/models/category.model.js";
import { getTopSpendingCategory } from "../analytics/analytics.service.js";

const now = () => new Date();

/**
 * Get the user's top spending category (expense only). Returns categoryId or null.
 * @param {string|import('mongoose').Types.ObjectId} userId
 */
export async function getTopSpendingCategoryForUser(userId) {
  const { categoryId } = await getTopSpendingCategory(userId);
  return categoryId;
}

/**
 * Fetch active offers for a category: isActive true, validUntil > now.
 * @param {string|import('mongoose').Types.ObjectId} categoryId
 */
export async function getActiveOffersByCategory(categoryId) {
  return Offer.find({
    category: categoryId,
    isActive: true,
    validUntil: { $gt: now() }
  })
    .populate("category", "name color")
    .sort({ createdAt: -1 })
    .lean();
}

/**
 * Personalized offers: top spending category for user, then active offers for that category.
 * @param {string|import('mongoose').Types.ObjectId} userId
 */
export async function getPersonalizedOffers(userId) {
  const categoryId = await getTopSpendingCategoryForUser(userId);
  if (!categoryId) {
    return { topCategory: null, offers: [] };
  }
  const offers = await getActiveOffersByCategory(categoryId);
  const topCategory =
    offers[0]?.category != null
      ? { _id: offers[0].category._id, name: offers[0].category.name, color: offers[0].category.color }
      : await Category.findById(categoryId).select("name color").lean();
  return {
    topCategory: topCategory ? { _id: categoryId, name: topCategory.name, color: topCategory.color } : { _id: categoryId },
    offers
  };
}
