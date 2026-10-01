import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Alert } from "@/models";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const acknowledged = searchParams.get("acknowledged");
    const limit = parseInt(searchParams.get("limit") || "100", 10);

    await connectToDatabase();

    const query: any = {};
    if (acknowledged !== null) {
      query.acknowledged = acknowledged === "true";
    }

    const alerts = await Alert.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return NextResponse.json({ success: true, count: alerts.length, data: alerts });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { alertId, acknowledged } = body;

    if (!alertId) {
      return NextResponse.json({ error: "Missing alertId" }, { status: 400 });
    }

    await connectToDatabase();

    const updated = await Alert.findByIdAndUpdate(
      alertId,
      { acknowledged: acknowledged ?? true },
      { new: true }
    );

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
