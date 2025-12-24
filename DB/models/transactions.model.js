import mongoose, { Types } from "mongoose";

// Define schema for Transactions 
const schema = new mongoose.Schema(
  {
    user: { 
      type: Types.ObjectId, // User ID
      ref: "User", // Reference to User model
      required: [true, "user is required"], // User ID is required 
    },

    category: { 
      type: Types.ObjectId, // Category ID
      ref: "Category", // Reference to Category model
    },

    price: { 
      type: Number,
    },

    text: { 
      type: String,
    },

    OCR_path: { 
      type: String,
    },
    
    voice_path: { 
      type: String,
    },

  },
  { 
    timestamps: { updatedAt: false }, // Disables updatedAt field
    versionKey: false // Disables the versionKey (__v)
  }
);

// Create and export the Transactions  model
export const Transactions  = mongoose.model("Transactions", schema); // Export the Transactions  model
