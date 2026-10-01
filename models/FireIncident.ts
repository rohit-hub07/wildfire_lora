import mongoose, { Schema, Document, Model } from "mongoose";

export interface IFireIncident extends Document {
  deviceId: string;
  detectedAt: Date;
  location: {
    latitude: number;
    longitude: number;
  };
  temperature: number;
  humidity: number;
  smokeLevel: number;
  gasLevel: number;
  severity: "MODERATE" | "HIGH" | "CRITICAL";
  status: "ACTIVE" | "CONTAINED" | "RESOLVED" | "FALSE_ALARM";
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

const FireIncidentSchema = new Schema<IFireIncident>(
  {
    deviceId: { type: String, required: true, index: true },
    detectedAt: { type: Date, required: true, default: Date.now, index: true },
    location: {
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true },
    },
    temperature: { type: Number, required: true },
    humidity: { type: Number, required: true },
    smokeLevel: { type: Number, required: true },
    gasLevel: { type: Number, required: true },
    severity: {
      type: String,
      enum: ["MODERATE", "HIGH", "CRITICAL"],
      default: "CRITICAL",
    },
    status: {
      type: String,
      enum: ["ACTIVE", "CONTAINED", "RESOLVED", "FALSE_ALARM"],
      default: "ACTIVE",
    },
    description: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);

export const FireIncident: Model<IFireIncident> =
  mongoose.models.FireIncident || mongoose.model<IFireIncident>("FireIncident", FireIncidentSchema);
