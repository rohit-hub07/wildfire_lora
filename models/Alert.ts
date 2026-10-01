import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAlert extends Document {
  deviceId: string;
  type: string;
  severity: "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
  message: string;
  acknowledged: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const AlertSchema = new Schema<IAlert>(
  {
    deviceId: { type: String, required: true, index: true },
    type: { type: String, required: true, default: "WILDFIRE_RISK" },
    severity: {
      type: String,
      enum: ["LOW", "MODERATE", "HIGH", "CRITICAL"],
      required: true,
    },
    message: { type: String, required: true },
    acknowledged: { type: Boolean, default: false, index: true },
  },
  {
    timestamps: true,
  }
);

export const Alert: Model<IAlert> =
  mongoose.models.Alert || mongoose.model<IAlert>("Alert", AlertSchema);
