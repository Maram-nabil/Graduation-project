/**
 * Analytics service – pure Node.js + MongoDB aggregation.
 * Used for home real-time payload and top spending category (offers).
 */
import { Transactions } from "../../DB/models/transactions.model.js";

const activeMatch = { isDeleted: { $ne: true } };

/**
 * Build match for a user (and optionally expense-only).
 * @param {mongoose.Types.ObjectId} userId
 * @param {{ expenseOnly?: boolean }} [opts]
 */
function userMatch(userId, opts = {}) {
  const match = { user: userId, ...activeMatch };
  if (opts.expenseOnly) match.type = "expense";
  return match;
}

/**
 * Home analytics for WebSocket: total_amount, analysis_over_time (daily), category_analysis.
 * Matches the payload shape previously sent from Python (no base64 charts).
 * @param {mongoose.Types.ObjectId} userId
 * @param {{ start?: Date, end?: Date }} [timeRange]
 */
export async function getHomeAnalytics(userId, timeRange = {}) {
  const now = new Date();
  const start = timeRange.start || new Date(now.getFullYear(), now.getMonth(), 1);
  const end = timeRange.end || new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const match = { ...userMatch(userId), createdAt: { $gte: start, $lte: end } };

  const [totalResult, dailyPipeline, categoryPipeline] = await Promise.all([
    Transactions.aggregate([
      { $match: match },
      { $group: { _id: null, total_amount: { $sum: "$price" } } }
    ]),
    Transactions.aggregate([
      { $match: match },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          total: { $sum: "$price" }
        }
      },
      { $sort: { _id: 1 } }
    ]),
    Transactions.aggregate([
      { $match: match },
      { $group: { _id: "$category", total: { $sum: "$price" } } },
      { $lookup: { from: "categories", localField: "_id", foreignField: "_id", as: "cat" } },
      { $unwind: { path: "$cat", preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: { $ifNull: ["$cat.name", "Uncategorized"] },
          total: { $sum: "$total" }
        }
      },
      { $sort: { total: -1 } }
    ])
  ]);

  const total_amount = totalResult[0]?.total_amount ?? 0;
  const analysis_over_time = Object.fromEntries(
    dailyPipeline.map((d) => [d._id, Number(d.total)])
  );
  const category_analysis = Object.fromEntries(
    categoryPipeline.map((c) => [c._id, Number(c.total)])
  );

  return {
    total_amount,
    analysis_over_time,
    category_analysis
  };
}

/**
 * Top spending category for a user (expense only). Returns { categoryId } or { categoryId: null }.
 * @param {mongoose.Types.ObjectId} userId
 */
export async function getTopSpendingCategory(userId) {
  const result = await Transactions.aggregate([
    { $match: userMatch(userId, { expenseOnly: true }) },
    { $match: { category: { $exists: true, $ne: null } } },
    { $group: { _id: "$category", total: { $sum: "$price" } } },
    { $sort: { total: -1 } },
    { $limit: 1 }
  ]);

  const categoryId = result[0]?._id ?? null;
  return { categoryId };
}
