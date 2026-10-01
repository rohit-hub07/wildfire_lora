import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { SensorNode, SensorReading } from "@/models";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ deviceId: string }> }
) {
  try {
    const { deviceId } = await params;
    await connectToDatabase();

    const node = await SensorNode.findOne({ deviceId }).lean();
    if (!node) {
      return NextResponse.json({ error: "Sensor node not found" }, { status: 404 });
    }

    const latestReading = await SensorReading.findOne({ deviceId })
      .sort({ timestamp: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      data: {
        ...node,
        latestReading,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
