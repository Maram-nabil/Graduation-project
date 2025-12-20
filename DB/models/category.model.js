import mongoose, { Types } from "mongoose";

// Define schema for Category
const schema = new mongoose.Schema(
  {
    user: { 
      type: Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: { 
      type: String, // [ "food", "drink", "snack", "other" ]
    },
    items: { 
      type: [Types.ObjectId],
      ref: "Item",
      default: [],
    },
    color: { 
      type: String,
      default: "#ffffff"
    },
  },
  { 
    timestamps: { updatedAt: false }, // Disables updatedAt field
    versionKey: false // Disables the versionKey (__v)
  }
);

// Create and export the Category model
export const Category = mongoose.model("Category", schema); // Export the Category model
