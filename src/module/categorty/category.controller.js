import { Category } from "../../../DB/models/category.model.js";
import { ApiFeature } from "../../utils/API.Feature.js";
import { AppError } from "../../utils/AppError.js";
import { catchError } from "../../utils/catchError.js";

// Function: Get all categories
export const getMyCategory = catchError(async (req, res, next) => {
    console.log("Fetching my categories");

   
       const apiFeature = new ApiFeature(Transactions.find(), req.query);
   
     apiFeature
       .filter()
       .search()
       .sort()
       .select()
       .pagination();
   
     // Execute query - LEAN AFTER ALL MODIFICATIONS 
     const categories = await apiFeature.mongooseQuery
   
     // Calculate total count after base filter (type: creation)
     const totalCount = await Transactions.countDocuments({ type: "creation" });
   
     // Get response details from ApiFeature
     const responseDetails = await apiFeature.getResponseDetails();

    console.log("Data retrieved from database:", data);

    res.status(200).json({ message: "Data retrieved successfully", 
    meta: responseDetails,
    count : totalCount,
    data: categories });    
     });


// Function: Create a new category
export const createCategory = catchError(async (req, res, next) => {
    console.log("Received data:", req.body);

    const { name } = req.body;

    if (!name) {
        console.log("Name is required");
        return next(new AppError("Name is required", 400));
    }

    const data = await Category.create({
        user: req.user._id,
        name,
        items: [],
    });

    console.log("Data saved in database:", data);

    res.status(201).json({ message: "Category created successfully", data });
});

// Function: Create a new category
export const addItemsToCategory = catchError(async (req, res, next) => {
    console.log("Received data:", req.body);

    const { id } = req.params;
    const { name } = req.body;

    if (!name) {
        console.log("Name is required");
        return next(new AppError("Name is required", 400));
    }

    const data = await Category.create({
        user: req.user._id,
        name,
        items: [],
    });

    console.log("Data saved in database:", data);

    res.status(201).json({ message: "Category created successfully", data });
});


// Function: Delete a category
export const deleteCategory = catchError(async (req, res, next) => {
    const { id } = req.params;

    if (!id) {
        console.log("ID is required");
        return next(new AppError("ID is required", 400));
    }

    const data = await Category.findByIdAndDelete(id);

    if (!data) {
        return next(new AppError("Category not found", 404));
    }

    console.log("Category deleted from database:", data);

    res.status(200).json({ message: "Category deleted successfully", data });
});
