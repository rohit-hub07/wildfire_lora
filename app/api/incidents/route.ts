import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { FireIncident } from "@/models";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    await connectToDatabase();

    const query: any = {};
    if (status) {
      query.status = status;
    }

    const incidents = await FireIncident.find(query)
      .sort({ detectedAt: -1 })
      .limit(limit)
      .lean();

    return NextResponse.json({ success: true, count: incidents.length, data: incidents });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    await connectToDatabase();

    const incident = await FireIncident.create({
      ...body,
      detectedAt: body.detectedAt ? new Date(body.detectedAt) : new Date(),
    });

    return NextResponse.json({ success: true, data: incident }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
