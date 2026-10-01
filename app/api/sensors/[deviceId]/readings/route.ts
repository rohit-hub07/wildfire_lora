import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { SensorReading } from "@/models";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ deviceId: string }> }
) {
  try {
    const { deviceId } = await params;
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const sort = searchParams.get("sort") === "asc" ? 1 : -1;

    await connectToDatabase();

    const readings = await SensorReading.find({ deviceId })
      .sort({ timestamp: sort })
      .limit(limit)
      .lean();

    return NextResponse.json({
      success: true,
      deviceId,
      count: readings.length,
      data: readings,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
