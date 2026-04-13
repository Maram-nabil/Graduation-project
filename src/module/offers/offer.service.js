/**
 * Amazon product offers via RapidAPI Real-Time Amazon Data.
 * Top spending category from transactions → Amazon browse node → cached HTTP fetch.
 */
import axios from "axios";
import NodeCache from "node-cache";
import { Types } from "mongoose";
import { Transactions } from "../../DB/models/transactions.model.js";

const RAPIDAPI_HOST = "real-time-amazon-data.p.rapidapi.com";
const RAPIDAPI_BASE = `https://${RAPIDAPI_HOST}`;

/** Category name (case-insensitive) → Amazon browse node id */
const CATEGORY_TO_AMAZON_ID = {
  electronics: "172282",
  fashion: "7141123011",
  food: "16310101",
  books: "283155",
  sports: "3375251",
  beauty: "11059031"
};

const AMAZON_CATEGORIES = Object.entries(CATEGORY_TO_AMAZON_ID).map(([name, id]) => ({
  name,
  id
}));

const offersCache = new NodeCache({ stdTTL: 3600, checkperiod: 600 });

const activeMatch = { isDeleted: { $ne: true } };

function userExpenseMatch(userId) {
  return {
    user: userId,
    ...activeMatch,
    type: "expense",
    category: { $exists: true, $ne: null }
  };
}

/**
 * Find the user's top spending category name (expenses only) via aggregation.
 * @param {import("mongoose").Types.ObjectId} userId
 * @returns {Promise<string|null>} Category name or null if no data
 */
export async function getTopSpendingCategoryName(userId) {
  const pipeline = [
    { $match: userExpenseMatch(userId) },
    { $group: { _id: "$category", total: { $sum: "$price" } } },
    { $sort: { total: -1 } },
    { $limit: 1 },
    {
      $lookup: {
        from: "categories",
        localField: "_id",
        foreignField: "_id",
        as: "cat"
      }
    },
    { $unwind: { path: "$cat", preserveNullAndEmptyArrays: true } },
    {
      $project: {
        name: { $ifNull: ["$cat.name", null] }
      }
    }
  ];

  const rows = await Transactions.aggregate(pipeline);
  const name = rows[0]?.name;
  return typeof name === "string" && name.trim() ? name.trim() : null;
}

/**
 * Pick random category (used when user has no expenses yet).
 */
export function pickRandomAmazonCategory() {
  const randomIndex = Math.floor(Math.random() * AMAZON_CATEGORIES.length);
  return AMAZON_CATEGORIES[randomIndex];
}

/**
 * Map app category name to Amazon id; unknown category → random known category id.
 * @param {string|null} categoryName
 */
export function resolveAmazonCategoryId(categoryName) {
  if (!categoryName) return pickRandomAmazonCategory().id;
  const key = categoryName.trim().toLowerCase();
  return CATEGORY_TO_AMAZON_ID[key] ?? pickRandomAmazonCategory().id;
}

export function resolveDisplayCategoryName(categoryName, amazonId) {
  if (categoryName) return categoryName;
  const entry = Object.entries(CATEGORY_TO_AMAZON_ID).find(([, id]) => id === amazonId);
  if (entry) return entry[0].replace(/^./, (c) => c.toUpperCase());
  return pickRandomAmazonCategory().name.replace(/^./, (c) => c.toUpperCase());
}

function extractProducts(payload) {
  const root = payload?.data ?? payload;
  const nested = root?.data;
  const list =
    root?.products ??
    nested?.products ??
    root?.product_list ??
    root?.items;
  if (Array.isArray(list)) return list;
  return [];
}

function mapProduct(raw) {
  return {
    title: raw.product_title ?? raw.title ?? "",
    price: raw.product_price ?? raw.price ?? null,
    image: raw.product_photo ?? raw.image ?? raw.product_image ?? null,
    url: raw.product_url ?? raw.url ?? null,
    rating: raw.product_star_rating ?? raw.rating ?? raw.stars ?? null
  };
}

/**
 * @param {string} amazonCategoryId
 * @returns {Promise<{ products: ReturnType<typeof mapProduct>[], fromCache: boolean }>}
 */
export async function getOffersForAmazonCategory(amazonCategoryId) {
  const cacheKey = `amazon-offers:${amazonCategoryId}`;
  const hit = offersCache.get(cacheKey);
  if (hit) {
    return { products: hit, fromCache: true };
  }

  const key = process.env.RAPIDAPI_KEY;
  if (!key) {
    const err = new Error("RAPIDAPI_KEY is not configured");
    err.statusCode = 503;
    throw err;
  }

  let response;
  try {
    response = await axios.get(`${RAPIDAPI_BASE}/products-by-category`, {
      params: {
        category_id: amazonCategoryId,
        deals_and_discounts:"TODAYS_DEALS" ,
        country: "US",
        page: 1
      },
      headers: {
        "X-RapidAPI-Key": key,
        "X-RapidAPI-Host": RAPIDAPI_HOST
      },
      timeout: 25000,
      validateStatus: () => true
    });
  } catch (e) {
    const err = new Error(e.message || "Failed to reach Amazon data API");
    err.statusCode = 502;
    err.cause = e;
    throw err;
  }

  if (response.status < 200 || response.status >= 300) {
    console.log('[AMAZON API ERROR] Status:', response.status);
    console.log('[AMAZON API ERROR] Data:', JSON.stringify(response.data));
    const msg =
      response.data?.message ||
      response.data?.error ||
      `Amazon data API returned status ${response.status}`;
    const err = new Error(msg);
    err.statusCode = 502;
    throw err;
  }

  const rawList = extractProducts(response.data);
  const products = rawList.slice(0, 10).map(mapProduct);
  offersCache.set(cacheKey, products);
  return { products, fromCache: false };
}

/**
 * @param {string} userIdHex
 */
export async function getPersonalizedOffers(userIdHex) {
  const userId = new Types.ObjectId(userIdHex);
  const topName = await getTopSpendingCategoryName(userId);
  const amazonId = resolveAmazonCategoryId(topName);
  const categoryLabel = topName ?? resolveDisplayCategoryName(null, amazonId);
  const { products, fromCache } = await getOffersForAmazonCategory(amazonId);
  return {
    category: categoryLabel,
    amazonCategoryId: amazonId,
    defaultedCategory: !topName,
    products,
    fromCache
  };
}

export function isValidUserId(userId) {
  return typeof userId === "string" && Types.ObjectId.isValid(userId);
}

/**
 * Admin: snapshot of cached Amazon offer payloads (in-memory NodeCache).
 * @returns {{ entries: Array<{ cacheKey: string, amazonCategoryId: string | null, productCount: number, products: ReturnType<typeof mapProduct>[] }>, stats: ReturnType<NodeCache["getStats"]> }}
 */
export function getOffersCacheAdminSnapshot() {
  const keys = offersCache.keys();
  const entries = keys.map((k) => {
    const products = offersCache.get(k) || [];
    const amazonCategoryId = k.startsWith("amazon-offers:") ? k.slice("amazon-offers:".length) : null;
    return {
      cacheKey: k,
      amazonCategoryId,
      productCount: Array.isArray(products) ? products.length : 0,
      products: Array.isArray(products) ? products : []
    };
  });
  return {
    entries,
    stats: offersCache.getStats()
  };
}
