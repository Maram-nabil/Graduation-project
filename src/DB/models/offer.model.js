import mongoose, { Types } from "mongoose";

const schema = new mongoose.Schema(
  {
    platformName: {
      type: String,
      required: true,
      trim: true
    },
    category: {
      type: Types.ObjectId,
      ref: "Category",
      required: true,
      index: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    discountPercentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    imageUrl: {
      type: String,
      trim: true
    },
    redirectUrl: {
      type: String,
      trim: true
    },
    validUntil: {
      type: Date,
      required: true,
      index: true
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

schema.index({ category: 1, isActive: 1, validUntil: 1 });

export const Offer = mongoose.model("Offer", schema);
