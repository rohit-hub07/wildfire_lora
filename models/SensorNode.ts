import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISensorNode extends Document {
  deviceId: string;
  name: string;
  latitude: number;
  longitude: number;
  status: "ONLINE" | "OFFLINE" | "WARNING" | "MAINTENANCE";
  batteryVoltage: number;
  lastSeen: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SensorNodeSchema = new Schema<ISensorNode>(
  {
    deviceId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    status: {
      type: String,
      enum: ["ONLINE", "OFFLINE", "WARNING", "MAINTENANCE"],
      default: "ONLINE",
    },
    batteryVoltage: { type: Number, required: true },
    lastSeen: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

export const SensorNode: Model<ISensorNode> =
  mongoose.models.SensorNode || mongoose.model<ISensorNode>("SensorNode", SensorNodeSchema);
