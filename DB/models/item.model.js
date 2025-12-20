import mongoose, { Types } from "mongoose";

// Define schema for Item
const schema = new mongoose.Schema(
  {
    user: { 
      type: Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: { 
      type: String,
    },
    price : { 
      type: String,
    },
  },
  { 
    timestamps: { updatedAt: false }, // Disables updatedAt field
    versionKey: false // Disables the versionKey (__v)
  }
);

// Create and export the Item model
export const Item = mongoose.model("Item", schema); // Export the Item model
