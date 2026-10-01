import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { SensorNode } from "@/models";

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const sensors = await SensorNode.find().sort({ deviceId: 1 }).lean();
    return NextResponse.json({ success: true, count: sensors.length, data: sensors });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
