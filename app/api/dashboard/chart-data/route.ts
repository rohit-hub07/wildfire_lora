import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { SensorReading } from "@/models";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const deviceId = searchParams.get("deviceId");
    const hours = parseInt(searchParams.get("hours") || "24", 10);

    await connectToDatabase();

    const sinceDate = new Date(Date.now() - hours * 60 * 60 * 1000);
    const query: any = { timestamp: { $gte: sinceDate } };
    if (deviceId) {
      query.deviceId = deviceId;
    }

    const readings = await SensorReading.find(query)
      .sort({ timestamp: 1 })
      .limit(500)
      .lean();

    const formatted = readings.map((r) => ({
      id: r._id,
      deviceId: r.deviceId,
      timestamp: r.timestamp,
      time: new Date(r.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      temperature: r.temperature,
      humidity: r.humidity,
      smokeLevel: r.smokeLevel,
      gasLevel: r.gasLevel,
      flameDetected: r.flameDetected,
      riskScore: r.riskScore,
      riskLevel: r.riskLevel,
    }));

    return NextResponse.json({ success: true, count: formatted.length, data: formatted });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
