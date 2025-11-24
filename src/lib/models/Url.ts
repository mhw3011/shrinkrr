import mongoose, { Schema, model, models } from "mongoose";

const UrlSchema = new Schema(
  {
    originalUrl: { type: String, required: true },
    shortCode: { type: String, required: true, unique: true },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days fromc creation
    },
  },
  { timestamps: true }
);

const Url = models.Url || model("Url", UrlSchema);
export default Url;
