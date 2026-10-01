import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { SensorNode, SensorReading, Alert, FireIncident } from "@/models";

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();

    const [nodes, latestReadings, alerts, incidents] = await Promise.all([
      SensorNode.find().lean(),
      SensorReading.aggregate([
        { $sort: { timestamp: -1 } },
        {
          $group: {
            _id: "$deviceId",
            doc: { $first: "$$ROOT" },
          },
        },
        { $replaceRoot: { newRoot: "$doc" } },
      ]),
      Alert.find({ acknowledged: false }).sort({ createdAt: -1 }).lean(),
      FireIncident.find({ status: "ACTIVE" }).lean(),
    ]);

    const totalSensors = nodes.length;
    const onlineSensors = nodes.filter((n) => n.status === "ONLINE").length;
    const offlineSensors = nodes.filter((n) => n.status === "OFFLINE").length;

    let normalSensors = 0;
    let highRiskSensors = 0;
    let criticalSensors = 0;

    let totalTemp = 0;
    let totalHum = 0;
    const count = latestReadings.length;

    latestReadings.forEach((r) => {
      totalTemp += r.temperature || 0;
      totalHum += r.humidity || 0;

      if (r.riskLevel === "CRITICAL") {
        criticalSensors++;
      } else if (r.riskLevel === "HIGH" || r.riskLevel === "VERY_HIGH") {
        highRiskSensors++;
      } else {
        normalSensors++;
      }
    });

    const avgTemperature = count > 0 ? Number((totalTemp / count).toFixed(1)) : 0;
    const avgHumidity = count > 0 ? Number((totalHum / count).toFixed(1)) : 0;

    return NextResponse.json({
      success: true,
      stats: {
        totalSensors,
        onlineSensors,
        offlineSensors,
        normalSensors,
        highRiskSensors,
        criticalSensors,
        activeAlerts: alerts.length,
        activeIncidents: incidents.length,
        avgTemperature,
        avgHumidity,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
