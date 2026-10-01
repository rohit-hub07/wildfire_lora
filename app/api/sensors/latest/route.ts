import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { SensorReading, SensorNode } from "@/models";

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();

    // Aggregate to get the latest reading for each sensor node
    const latestReadings = await SensorReading.aggregate([
      { $sort: { timestamp: -1 } },
      {
        $group: {
          _id: "$deviceId",
          doc: { $first: "$$ROOT" },
        },
      },
      { $replaceRoot: { newRoot: "$doc" } },
    ]);

    const sensorNodes = await SensorNode.find().lean();
    const nodeMap = new Map(sensorNodes.map((n) => [n.deviceId, n]));

    const combined = latestReadings.map((r) => {
      const node = nodeMap.get(r.deviceId);
      return {
        ...r,
        nodeName: node?.name || `Node ${r.deviceId}`,
        status: node?.status || "ONLINE",
        batteryVoltage: r.batteryVoltage || node?.batteryVoltage || 3.7,
      };
    });

    return NextResponse.json({ success: true, count: combined.length, data: combined });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
