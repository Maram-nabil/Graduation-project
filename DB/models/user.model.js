import mongoose from "mongoose";

// User schema definition
const schema = new mongoose.Schema(
  {
    fullname: { type: String, trim: true },

    firstName: { type: String, trim: true },

    lastName: { type: String, trim: true },

    email: { type: String, trim: true, unique: true },

    password: { type: String },

    phone: { type: String },

    confEmail: { type: Boolean, default: false },

    isBlocked: { type: Boolean, default: false },

    OTP: { type: String, match: [/^\d{4,6}$/, "OTP must be a 4 to 6 digit number"], default: null },

  },
  { timestamps: { updatedAt: false }, versionKey: false }
);


// Export User model
export const User = mongoose.model("User", schema);
