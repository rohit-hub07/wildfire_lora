import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { SensorNode, SensorReading, Alert, FireIncident } from "@/models";
import { calculateWildfireRisk } from "@/lib/riskAnalysis";
import { indexReadingInChroma } from "@/lib/rag";
import { realtimeManager } from "@/lib/realtime";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // 1. Validation
    const {
      deviceId,
      timestamp,
      location,
      temperature,
      humidity,
      smokeLevel,
      gasLevel,
      flameDetected,
      pressure,
      airQuality,
      batteryVoltage,
      signalStrength,
    } = body;

    if (!deviceId || typeof deviceId !== "string") {
      return NextResponse.json({ error: "Missing or invalid deviceId" }, { status: 400 });
    }
    if (typeof temperature !== "number" || isNaN(temperature)) {
      return NextResponse.json({ error: "Missing or invalid temperature" }, { status: 400 });
    }
    if (typeof humidity !== "number" || isNaN(humidity)) {
      return NextResponse.json({ error: "Missing or invalid humidity" }, { status: 400 });
    }
    if (typeof smokeLevel !== "number" || isNaN(smokeLevel)) {
      return NextResponse.json({ error: "Missing or invalid smokeLevel" }, { status: 400 });
    }
    if (typeof gasLevel !== "number" || isNaN(gasLevel)) {
      return NextResponse.json({ error: "Missing or invalid gasLevel" }, { status: 400 });
    }
    if (typeof flameDetected !== "boolean") {
      return NextResponse.json({ error: "Missing or invalid flameDetected" }, { status: 400 });
    }

    await connectToDatabase();

    const readingTime = timestamp ? new Date(timestamp) : new Date();
    const loc = location || { latitude: 26.1445, longitude: 91.7362 };

    // 2. Risk Analysis Calculation
    const riskAnalysis = calculateWildfireRisk({
      temperature,
      humidity,
      smokeLevel,
      gasLevel,
      flameDetected,
      airQuality,
      pressure,
    });

    // 3. Save Raw Sensor Reading in MongoDB
    const sensorReading = await SensorReading.create({
      deviceId,
      timestamp: readingTime,
      location: {
        latitude: Number(loc.latitude) || 0,
        longitude: Number(loc.longitude) || 0,
      },
      temperature: Number(temperature),
      humidity: Number(humidity),
      smokeLevel: Number(smokeLevel),
      gasLevel: Number(gasLevel),
      flameDetected: Boolean(flameDetected),
      pressure: pressure !== undefined ? Number(pressure) : undefined,
      airQuality: airQuality !== undefined ? Number(airQuality) : undefined,
      batteryVoltage: batteryVoltage !== undefined ? Number(batteryVoltage) : undefined,
      signalStrength: signalStrength !== undefined ? Number(signalStrength) : undefined,
      riskScore: riskAnalysis.riskScore,
      riskLevel: riskAnalysis.riskLevel,
      riskReasons: riskAnalysis.reasons,
    });

    // 4. Update / Upsert SensorNode entry
    let nodeStatus: "ONLINE" | "OFFLINE" | "WARNING" | "MAINTENANCE" = "ONLINE";
    if (batteryVoltage !== undefined && batteryVoltage < 3.2) {
      nodeStatus = "WARNING";
    }

    await SensorNode.findOneAndUpdate(
      { deviceId },
      {
        deviceId,
        name: `Node ${deviceId}`,
        latitude: loc.latitude,
        longitude: loc.longitude,
        status: nodeStatus,
        batteryVoltage: batteryVoltage ?? 3.7,
        lastSeen: readingTime,
      },
      { upsert: true, new: true }
    );

    // 5. Trigger Alerts and FireIncidents if danger is high or critical
    let createdAlert = null;
    let createdIncident = null;

    if (riskAnalysis.riskLevel === "CRITICAL" || flameDetected || riskAnalysis.riskScore >= 75) {
      let alertMsg = "";
      if (flameDetected) {
        alertMsg = `CRITICAL: Flame detected on ${deviceId}! Smoke: ${smokeLevel}, Temp: ${temperature}°C.`;
      } else if (riskAnalysis.riskLevel === "CRITICAL") {
        alertMsg = `CRITICAL WILDFIRE RISK on ${deviceId}: Score ${riskAnalysis.riskScore}/100. Factors: ${riskAnalysis.reasons.join(", ")}`;
      } else {
        alertMsg = `HIGH RISK WARNING on ${deviceId}: Score ${riskAnalysis.riskScore}/100. Factors: ${riskAnalysis.reasons.join(", ")}`;
      }

      createdAlert = await Alert.create({
        deviceId,
        type: "WILDFIRE_RISK",
        severity: riskAnalysis.riskLevel === "CRITICAL" || flameDetected ? "CRITICAL" : "HIGH",
        message: alertMsg,
        acknowledged: false,
      });

      if (flameDetected || riskAnalysis.riskScore >= 85) {
        createdIncident = await FireIncident.create({
          deviceId,
          detectedAt: readingTime,
          location: {
            latitude: Number(loc.latitude) || 0,
            longitude: Number(loc.longitude) || 0,
          },
          temperature,
          humidity,
          smokeLevel,
          gasLevel,
          severity: flameDetected ? "CRITICAL" : "HIGH",
          status: "ACTIVE",
          description: `Automatic incident triggered by ${deviceId}. ${riskAnalysis.reasons.join(", ")}.`,
        });
      }
    }

    // 6. Convert reading into document & store in ChromaDB
    try {
      await indexReadingInChroma(sensorReading);
    } catch (chromaErr) {
      console.warn("ChromaDB indexing note:", chromaErr);
    }

    // 7. Push real-time event to SSE subscribers
    realtimeManager.notify({
      type: "SENSOR_READING",
      data: {
        reading: sensorReading,
        alert: createdAlert,
        incident: createdIncident,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Sensor reading ingested and processed successfully",
        readingId: sensorReading._id,
        riskScore: riskAnalysis.riskScore,
        riskLevel: riskAnalysis.riskLevel,
        alertTriggered: Boolean(createdAlert),
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error ingesting sensor data:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}
