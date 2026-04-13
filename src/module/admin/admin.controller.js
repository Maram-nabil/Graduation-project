import { AppError } from "../../utils/AppError.js";
import { catchError } from "../../utils/catchError.js";
import * as adminService from "./admin.service.js";

function assertNotSelf(req, targetUserId) {
  if (String(req.user._id) === String(targetUserId)) {
    throw new AppError("You cannot perform this action on your own account", 403);
  }
}

export const getStats = catchError(async (req, res) => {
  const stats = await adminService.getStats();
  res.status(200).json({ message: "Statistics retrieved successfully", data: stats });
});

export const getUsers = catchError(async (req, res) => {
  const { page, limit } = req.query;
  const result = await adminService.getAllUsers(page, limit);
  res.status(200).json({
    message: "Users retrieved successfully",
    meta: result.meta,
    data: result.data
  });
});

export const getUser = catchError(async (req, res) => {
  const { id } = req.params;
  const result = await adminService.getUserById(id);
  res.status(200).json({
    message: "User retrieved successfully",
    data: result.user,
    spendingSummary: result.spendingSummary
  });
});

export const blockUser = catchError(async (req, res) => {
  const { id } = req.params;
  assertNotSelf(req, id);
  const result = await adminService.toggleBlockUser(id);
  res.status(200).json(result);
});

export const removeUser = catchError(async (req, res) => {
  const { id } = req.params;
  assertNotSelf(req, id);
  const hard = req.query.hard === "true" || req.query.hard === "1";
  const result = await adminService.deleteUser(id, { hard });
  res.status(200).json(result);
});

export const listCategories = catchError(async (req, res) => {
  const data = await adminService.getAllCategories();
  res.status(200).json({
    message: "Categories retrieved successfully",
    count: data.length,
    data
  });
});

export const listItems = catchError(async (req, res) => {
  const data = await adminService.getAllItems();
  res.status(200).json({
    message: "Items retrieved successfully",
    count: data.length,
    data
  });
});

export const listTransactions = catchError(async (req, res) => {
  const { userId, category, startDate, endDate, page, limit } = req.query;
  const result = await adminService.getAllTransactions({
    userId,
    category,
    startDate,
    endDate,
    page,
    limit
  });
  res.status(200).json({
    message: "Transactions retrieved successfully",
    meta: result.meta,
    data: result.data
  });
});

export const listOffers = catchError(async (req, res) => {
  const snapshot = adminService.getOffersAdmin();
  res.status(200).json({
    message: "Offers cache retrieved successfully",
    stats: snapshot.stats,
    count: snapshot.entries.length,
    data: snapshot.entries
  });
});
