import { Item } from "../../../DB/models/item.model.js";
import { Category } from "../../../DB/models/category.model.js";
import { AppError } from "../../utils/AppError.js";
import { catchError } from "../../utils/catchError.js";
import { ApiFeature } from "../../utils/API.Feature.js";

/* =======================
   Create Item
======================= */
export const createItem = catchError(async (req, res, next) => {
  const { name, price, categoryId } = req.body;

  if (!name || !price || !categoryId) {
    return next(new AppError("name, price and categoryId are required", 400));
  }

  const item = await Item.create({
    user: req.user._id,
    name,
    price,
  });

  // add item to category
  await Category.findByIdAndUpdate(
    categoryId,
    { $push: { items: item._id } },
    { new: true }
  );

  res.status(201).json({
    message: "Item created successfully",
    data: item,
  });
});

/* =======================
   Get My Items
======================= */
export const getMyItems = catchError(async (req, res, next) => {

         const apiFeature = new ApiFeature(Item.find(), req.query);
     
       apiFeature
         .filter()
         .search()
         .sort()
         .select()
         .pagination();
     
       // Execute query - LEAN AFTER ALL MODIFICATIONS 
       const items = await apiFeature.mongooseQuery
     
       // Calculate total count after base filter (type: creation)
       const totalCount = await Item.countDocuments({ type: "creation" });
     
       // Get response details from ApiFeature
       const responseDetails = await apiFeature.getResponseDetails();

  res.status(200).json({
    message: "Items retrieved successfully",
    responseDetails,
    count: totalCount,
    data: items,
  });
});

/* =======================
   Get Single Item
======================= */
export const getItemById = catchError(async (req, res, next) => {
  const { id } = req.params;

  const item = await Item.findOne({ _id: id, user: req.user._id });

  if (!item) {
    return next(new AppError("Item not found", 404));
  }

  res.status(200).json({
    message: "Item retrieved successfully",
    data: item,
  });
});

/* =======================
   Update Item
======================= */
export const updateItem = catchError(async (req, res, next) => {
  const { id } = req.params;

  const item = await Item.findOneAndUpdate(
    { _id: id, user: req.user._id },
    req.body,
    { new: true }
  );

  if (!item) {
    return next(new AppError("Item not found", 404));
  }

  res.status(200).json({
    message: "Item updated successfully",
    data: item,
  });
});

/* =======================
   Delete Item
======================= */
export const deleteItem = catchError(async (req, res, next) => {
  const { oms } = req.params;

  const item = await Item.findOneAndDelete({
    _id: oms,
    user: req.user._id,
  });

  if (!item) {
    return next(new AppError("Item not found", 404));
  }

  // remove item from all categories
  await Category.updateMany(
    {},
    { $pull: { items: oms } }
  );

  res.status(200).json({
    message: "Item deleted successfully",
    data: item,
  });
});
