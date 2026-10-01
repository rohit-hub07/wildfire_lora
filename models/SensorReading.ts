import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISensorReading extends Document {
  deviceId: string;
  timestamp: Date;
  location: {
    latitude: number;
    longitude: number;
  };
  temperature: number;
  humidity: number;
  smokeLevel: number;
  gasLevel: number;
  flameDetected: boolean;
  pressure?: number;
  airQuality?: number;
  batteryVoltage?: number;
  signalStrength?: number;

  riskScore: number;
  riskLevel: "LOW" | "MODERATE" | "HIGH" | "VERY_HIGH" | "CRITICAL";
  riskReasons: string[];

  createdAt: Date;
  updatedAt: Date;
}

const SensorReadingSchema = new Schema<ISensorReading>(
  {
    deviceId: { type: String, required: true, index: true },
    timestamp: { type: Date, required: true, index: true },
    location: {
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true },
    },
    temperature: { type: Number, required: true },
    humidity: { type: Number, required: true },
    smokeLevel: { type: Number, required: true },
    gasLevel: { type: Number, required: true },
    flameDetected: { type: Boolean, required: true, index: true },
    pressure: { type: Number },
    airQuality: { type: Number },
    batteryVoltage: { type: Number },
    signalStrength: { type: Number },

    riskScore: { type: Number, required: true },
    riskLevel: {
      type: String,
      enum: ["LOW", "MODERATE", "HIGH", "VERY_HIGH", "CRITICAL"],
      required: true,
      index: true,
    },
    riskReasons: [{ type: String }],
  },
  {
    timestamps: true,
  }
);

// Compound index for historical fast query per device ordered by time
SensorReadingSchema.index({ deviceId: 1, timestamp: -1 });
SensorReadingSchema.index({ timestamp: -1, riskLevel: 1 });

export const SensorReading: Model<ISensorReading> =
  mongoose.models.SensorReading || mongoose.model<ISensorReading>("SensorReading", SensorReadingSchema);
