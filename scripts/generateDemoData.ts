import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { connectToDatabase } from "../lib/mongodb";
import { SensorNode, SensorReading, Alert, FireIncident } from "../models";
import { calculateWildfireRisk } from "../lib/riskAnalysis";
import { indexReadingInChroma } from "../lib/rag";

const SENSORS = [
  {
    deviceId: "NODE-001",
    name: "Ridge Lookout Alpha (NODE-001)",
    latitude: 26.1445,
    longitude: 91.7362,
    status: "ONLINE",
    batteryVoltage: 8.7,
  },
  {
    deviceId: "NODE-002",
    name: "Canyon Sector West (NODE-002)",
    latitude: 26.1382,
    longitude: 91.7254,
    status: "ONLINE",
    batteryVoltage: 8.2,
  },
  {
    deviceId: "NODE-003",
    name: "Pine Forest Canopy (NODE-003)",
    latitude: 26.1492,
    longitude: 91.7483,
    status: "ONLINE",
    batteryVoltage: 8.4,
  },
  {
    deviceId: "NODE-004",
    name: "River Valley Base (NODE-004)",
    latitude: 26.1298,
    longitude: 91.7411,
    status: "ONLINE",
    batteryVoltage: 8.8,
  },
  {
    deviceId: "NODE-005",
    name: "East Slope Tower (NODE-005)",
    latitude: 26.1554,
    longitude: 91.7599,
    status: "OFFLINE", // Sensor going offline scenario
    batteryVoltage: 3.1, // low battery
  },
];

async function generateDemoData() {
  console.log("Connecting to MongoDB for generating 24-hour demo simulation dataset...");
  await connectToDatabase();

  // Reset collections
  console.log("Clearing previous sensor readings, nodes, alerts, and incidents...");
  await SensorNode.deleteMany({});
  await SensorReading.deleteMany({});
  await Alert.deleteMany({});
  await FireIncident.deleteMany({});

  // Seed nodes
  for (const s of SENSORS) {
    await SensorNode.create({
      deviceId: s.deviceId,
      name: s.name,
      latitude: s.latitude,
      longitude: s.longitude,
      status: s.status as any,
      batteryVoltage: s.batteryVoltage,
      lastSeen: new Date(),
    });
  }

  console.log("Generating 24 hours of simulated LoRa sensor telemetry...");

  const now = Date.now();
  const totalSteps = 48; // every 30 minutes for 24 hours
  const stepMs = 30 * 60 * 1000;

  const readingBatch = [];

  for (let i = totalSteps; i >= 0; i--) {
    const timestamp = new Date(now - i * stepMs);
    const progress = (totalSteps - i) / totalSteps; // 0.0 to 1.0

    // 1. NODE-001: High risk scenario developing (Increasing temp, decreasing humidity, rising smoke)
    // Demodata specific target: 42.7°C, 18.4% RH, smoke 735, gas 612
    const node1Temp = +(28 + progress * 14.7).toFixed(1);
    const node1Hum = +(55 - progress * 36.6).toFixed(1);
    const node1Smoke = Math.round(120 + progress * 615);
    const node1Gas = Math.round(150 + progress * 462);
    const node1Flame = false;

    const risk1 = calculateWildfireRisk({
      temperature: node1Temp,
      humidity: node1Hum,
      smokeLevel: node1Smoke,
      gasLevel: node1Gas,
      flameDetected: node1Flame,
      airQuality: 168,
      pressure: 1007.4,
    });

    readingBatch.push({
      deviceId: "NODE-001",
      timestamp,
      location: { latitude: 26.1445, longitude: 91.7362 },
      temperature: node1Temp,
      humidity: node1Hum,
      smokeLevel: node1Smoke,
      gasLevel: node1Gas,
      flameDetected: node1Flame,
      pressure: 1007.4,
      airQuality: 168,
      batteryVoltage: 8.7,
      signalStrength: -72,
      riskScore: risk1.riskScore,
      riskLevel: risk1.riskLevel,
      riskReasons: risk1.reasons,
    });

    // 2. NODE-002: Normal nominal conditions
    const node2Temp = +(24 + Math.sin(progress * Math.PI) * 5).toFixed(1);
    const node2Hum = +(62 - Math.sin(progress * Math.PI) * 8).toFixed(1);
    const node2Smoke = Math.round(90 + Math.random() * 25);
    const node2Gas = Math.round(110 + Math.random() * 30);
    const risk2 = calculateWildfireRisk({
      temperature: node2Temp,
      humidity: node2Hum,
      smokeLevel: node2Smoke,
      gasLevel: node2Gas,
      flameDetected: false,
      airQuality: 45,
      pressure: 1012.0,
    });

    readingBatch.push({
      deviceId: "NODE-002",
      timestamp,
      location: { latitude: 26.1382, longitude: 91.7254 },
      temperature: node2Temp,
      humidity: node2Hum,
      smokeLevel: node2Smoke,
      gasLevel: node2Gas,
      flameDetected: false,
      pressure: 1012.0,
      airQuality: 45,
      batteryVoltage: 8.2,
      signalStrength: -68,
      riskScore: risk2.riskScore,
      riskLevel: risk2.riskLevel,
      riskReasons: risk2.reasons,
    });

    // 3. NODE-003: Critical event scenario escalating to 49.6°C, 11.7% RH, Smoke 942, Gas 781, Flame True
    const isCriticalTime = i <= 2; // last 1 hour
    const node3Temp = isCriticalTime ? 49.6 : +(30 + progress * 16).toFixed(1);
    const node3Hum = isCriticalTime ? 11.7 : +(50 - progress * 32).toFixed(1);
    const node3Smoke = isCriticalTime ? 942 : Math.round(140 + progress * 600);
    const node3Gas = isCriticalTime ? 781 : Math.round(180 + progress * 450);
    const node3Flame = isCriticalTime;

    const risk3 = calculateWildfireRisk({
      temperature: node3Temp,
      humidity: node3Hum,
      smokeLevel: node3Smoke,
      gasLevel: node3Gas,
      flameDetected: node3Flame,
      airQuality: 287,
      pressure: 1004.8,
    });

    readingBatch.push({
      deviceId: "NODE-003",
      timestamp,
      location: { latitude: 26.1492, longitude: 91.7483 },
      temperature: node3Temp,
      humidity: node3Hum,
      smokeLevel: node3Smoke,
      gasLevel: node3Gas,
      flameDetected: node3Flame,
      pressure: 1004.8,
      airQuality: 287,
      batteryVoltage: 8.4,
      signalStrength: -81,
      riskScore: risk3.riskScore,
      riskLevel: risk3.riskLevel,
      riskReasons: risk3.reasons,
    });

    // 4. NODE-004: Moderate humidity / baseline forest conditions
    const node4Temp = +(27 + Math.cos(progress * 2) * 3).toFixed(1);
    const node4Hum = +(58 + Math.sin(progress * 2) * 6).toFixed(1);
    const risk4 = calculateWildfireRisk({
      temperature: node4Temp,
      humidity: node4Hum,
      smokeLevel: 110,
      gasLevel: 140,
      flameDetected: false,
      airQuality: 52,
      pressure: 1014.2,
    });

    readingBatch.push({
      deviceId: "NODE-004",
      timestamp,
      location: { latitude: 26.1298, longitude: 91.7411 },
      temperature: node4Temp,
      humidity: node4Hum,
      smokeLevel: 110,
      gasLevel: 140,
      flameDetected: false,
      pressure: 1014.2,
      airQuality: 52,
      batteryVoltage: 8.8,
      signalStrength: -65,
      riskScore: risk4.riskScore,
      riskLevel: risk4.riskLevel,
      riskReasons: risk4.reasons,
    });

    // 5. NODE-005: Sensor going offline scenario (stops reporting after 18 hours ago)
    if (i > 12) {
      const risk5 = calculateWildfireRisk({
        temperature: 29.1,
        humidity: 48.2,
        smokeLevel: 130,
        gasLevel: 160,
        flameDetected: false,
        airQuality: 60,
        pressure: 1009.5,
      });

      readingBatch.push({
        deviceId: "NODE-005",
        timestamp,
        location: { latitude: 26.1554, longitude: 91.7599 },
        temperature: 29.1,
        humidity: 48.2,
        smokeLevel: 130,
        gasLevel: 160,
        flameDetected: false,
        pressure: 1009.5,
        airQuality: 60,
        batteryVoltage: 3.1,
        signalStrength: -94,
        riskScore: risk5.riskScore,
        riskLevel: risk5.riskLevel,
        riskReasons: risk5.reasons,
      });
    }
  }

  const savedReadings = await SensorReading.insertMany(readingBatch);
  console.log(` Inserted ${savedReadings.length} sensor readings into MongoDB.`);

  // Create Alerts & Incidents
  console.log("Generating initial alerts & incidents...");
  await Alert.create([
    {
      deviceId: "NODE-003",
      type: "WILDFIRE_RISK",
      severity: "CRITICAL",
      message: "Possible wildfire detected. Flame detected with high smoke (942) and temperature (49.6°C).",
      acknowledged: false,
      createdAt: new Date(now - 15 * 60 * 1000),
    },
    {
      deviceId: "NODE-001",
      type: "WILDFIRE_RISK",
      severity: "HIGH",
      message: "High temperature (42.7°C) and critically low humidity (18.4%) with elevated smoke.",
      acknowledged: false,
      createdAt: new Date(now - 30 * 60 * 1000),
    },
    {
      deviceId: "NODE-005",
      type: "HARDWARE_OFFLINE",
      severity: "MODERATE",
      message: "Node NODE-005 missed 12 heartbeats. Voltage low (3.1V). Node transitioned to OFFLINE.",
      acknowledged: false,
      createdAt: new Date(now - 6 * 60 * 60 * 1000),
    },
  ]);

  await FireIncident.create({
    deviceId: "NODE-003",
    detectedAt: new Date(now - 15 * 60 * 1000),
    location: {
      latitude: 26.1492,
      longitude: 91.7483,
    },
    temperature: 49.6,
    humidity: 11.7,
    smokeLevel: 942,
    gasLevel: 781,
    severity: "CRITICAL",
    status: "ACTIVE",
    description: "Active wildfire detected at Pine Forest Canopy. Rapid flame detection with dense smoke plume and critical heat spike.",
  });

  // Index key readings into ChromaDB Vector Store
  console.log("Vectorizing key telemetry events into ChromaDB...");
  const sampleToVectorize = savedReadings.filter(
    (r) => r.riskLevel === "CRITICAL" || r.riskLevel === "HIGH" || r.deviceId === "NODE-003" || r.deviceId === "NODE-001"
  );

  let vectorCount = 0;
  for (const reading of sampleToVectorize.slice(-25)) {
    await indexReadingInChroma(reading);
    vectorCount++;
  }

  console.log(` Indexed ${vectorCount} critical telemetry vectors into ChromaDB.`);
  console.log("Demo data generation complete!");
  process.exit(0);
}

generateDemoData().catch((err) => {
  console.error("Error generating demo data:", err);
  process.exit(1);
});
