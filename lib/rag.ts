import { ISensorReading } from "@/models/SensorReading";
import { addDocumentToVectorStore, queryVectorStore, SENSOR_COLLECTION_NAME, KNOWLEDGE_COLLECTION_NAME } from "./chroma";
import { getGeminiModel, isGeminiConfigured } from "./gemini";
import { connectToDatabase } from "./mongodb";
import { SensorNode, SensorReading, FireIncident, Alert, KnowledgeDocument } from "@/models";

/**
 * Converts a raw sensor reading + risk assessment into a natural-language RAG document.
 * Example structure:
 * "Sensor NODE-003 recorded a temperature of 49.6°C and humidity of 11.7% at 09:32 UTC.
 * The smoke level was 942 and gas level was 781. Flame detection was TRUE.
 * The prototype wildfire risk score was 97, classified as CRITICAL.
 * The contributing factors were very high temperature, very low humidity, very high smoke level, high gas concentration, and detected flame."
 */
export function formatReadingToRAGDocument(reading: {
  deviceId: string;
  timestamp: Date | string;
  temperature: number;
  humidity: number;
  smokeLevel: number;
  gasLevel: number;
  flameDetected: boolean;
  pressure?: number;
  airQuality?: number;
  batteryVoltage?: number;
  signalStrength?: number;
  riskScore: number;
  riskLevel: string;
  riskReasons?: string[];
  location?: { latitude: number; longitude: number };
}): string {
  const timeStr = typeof reading.timestamp === "string" ? reading.timestamp : reading.timestamp.toISOString();
  const reasonsText = reading.riskReasons && reading.riskReasons.length > 0
    ? reading.riskReasons.join(", ")
    : "nominal conditions";

  return `Sensor ${reading.deviceId} recorded a temperature of ${reading.temperature}°C and humidity of ${reading.humidity}% at ${timeStr}. The smoke level was ${reading.smokeLevel} and gas level was ${reading.gasLevel}. Flame detection was ${reading.flameDetected ? "TRUE" : "FALSE"}. Pressure was ${reading.pressure ?? "N/A"} hPa and air quality index was ${reading.airQuality ?? "N/A"}. The prototype wildfire risk score was ${reading.riskScore}, classified as ${reading.riskLevel}. The contributing factors were ${reasonsText}. Location coordinates: [${reading.location?.latitude ?? "unknown"}, ${reading.location?.longitude ?? "unknown"}].`;
}

/**
 * Index an individual sensor reading into ChromaDB
 */
export async function indexReadingInChroma(reading: ISensorReading | any) {
  const doc = formatReadingToRAGDocument(reading);
  const id = `reading_${reading.deviceId}_${new Date(reading.timestamp).getTime()}`;
  const metadata = {
    deviceId: reading.deviceId,
    timestamp: new Date(reading.timestamp).toISOString(),
    riskLevel: reading.riskLevel,
    riskScore: Number(reading.riskScore),
    flameDetected: Boolean(reading.flameDetected),
    temperature: Number(reading.temperature),
    humidity: Number(reading.humidity),
    smokeLevel: Number(reading.smokeLevel),
  };

  await addDocumentToVectorStore(SENSOR_COLLECTION_NAME, id, doc, metadata);
}

/**
 * RAG Chat Processing pipeline
 * Rules:
 * 1. Current readings -> Use MongoDB to obtain latest sensor data
 * 2. Historical readings -> MongoDB + ChromaDB
 * 3. Sensor Knowledge -> ChromaDB knowledge documents
 * 4. Grounded in facts: AI must NOT invent sensor values. If information does not exist: "I don't have enough sensor data to answer that."
 */
export async function processRAGChat(question: string): Promise<{
  answer: string;
  sources: Array<{ document: string; metadata: any; score?: number }>;
  retrievedReadings?: any[];
  contextUsed: string;
}> {
  await connectToDatabase();

  const lowerQ = question.toLowerCase();

  // 1. Fetch live / current MongoDB context
  const latestSensors = await SensorNode.find().lean();
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

  const activeIncidents = await FireIncident.find({ status: { $in: ["ACTIVE", "CONTAINED"] } })
    .sort({ detectedAt: -1 })
    .limit(5)
    .lean();

  const recentAlerts = await Alert.find().sort({ createdAt: -1 }).limit(5).lean();

  // 2. Vector search in ChromaDB (both Knowledge Base and Sensor Readings)
  const knowledgeDocs = await queryVectorStore(KNOWLEDGE_COLLECTION_NAME, question, 4);
  const sensorDocs = await queryVectorStore(SENSOR_COLLECTION_NAME, question, 4);

  const combinedSources = [...knowledgeDocs, ...sensorDocs];

  // 3. Build synthesis prompt context
  let contextPrompt = `=== LATEST SENSORY TELEMETRY (MONGODB - SOURCE OF TRUTH) ===\n`;
  if (latestReadings.length === 0) {
    contextPrompt += "No live sensor readings currently recorded.\n";
  } else {
    for (const r of latestReadings) {
      contextPrompt += `Device: ${r.deviceId} | Temp: ${r.temperature}°C | Humidity: ${r.humidity}% | Smoke: ${r.smokeLevel} | Gas: ${r.gasLevel} | Flame: ${r.flameDetected} | Risk Score: ${r.riskScore} (${r.riskLevel}) | Reasons: ${r.riskReasons?.join(", ") || "None"} | Last Recorded: ${r.timestamp}\n`;
    }
  }

  contextPrompt += `\n=== SENSOR NODES STATUS ===\n`;
  for (const n of latestSensors) {
    contextPrompt += `Device: ${n.deviceId} (${n.name}) | Status: ${n.status} | Battery: ${n.batteryVoltage}V | Lat: ${n.latitude}, Lon: ${n.longitude} | Last seen: ${n.lastSeen}\n`;
  }

  if (activeIncidents.length > 0) {
    contextPrompt += `\n=== ACTIVE FIRE INCIDENTS ===\n`;
    for (const inc of activeIncidents) {
      contextPrompt += `Incident on ${inc.deviceId} at ${inc.detectedAt}: Severity=${inc.severity}, Status=${inc.status}, Description=${inc.description}\n`;
    }
  }

  if (recentAlerts.length > 0) {
    contextPrompt += `\n=== RECENT ALERTS ===\n`;
    for (const al of recentAlerts) {
      contextPrompt += `Alert [${al.severity}] ${al.deviceId}: ${al.message} (Created: ${al.createdAt})\n`;
    }
  }

  if (combinedSources.length > 0) {
    contextPrompt += `\n=== RETRIEVED VECTOR CONTEXT (CHROMADB) ===\n`;
    for (const src of combinedSources) {
      contextPrompt += `[Doc]: ${src.document}\n`;
    }
  }

  const systemInstructions = `You are the AI Wildfire Risk Intelligence Assistant for an IoT Sensor Network.
Your duty is to assist forest rangers and operators by providing precise, accurate, and evidence-grounded answers about sensor nodes, environmental telemetry, wildfire risk analysis, and hardware knowledge.

CRITICAL CONSTRAINTS:
1. Grounding: Rely EXCLUSIVELY on the provided context (MongoDB telemetry and ChromaDB knowledge/history).
2. DO NOT hallucinate or fabricate sensor values, device IDs, or risk scores.
3. If the required information cannot be determined from the provided context, you MUST respond exactly or clearly with: "I don't have enough sensor data to answer that."
4. Always explain risk factors (temperature, humidity, smoke, gas, flame) when asked about risk levels.
5. Provide a helpful, clear, and professional response.`;

  const userPrompt = `Context:
${contextPrompt}

Question:
${question}

Answer:`;

  if (isGeminiConfigured()) {
    try {
      const model = getGeminiModel("gemini-1.5-flash");
      const result = await model.generateContent([
        { text: systemInstructions },
        { text: userPrompt },
      ]);
      const answer = result.response.text();
      return {
        answer: answer.trim(),
        sources: combinedSources,
        retrievedReadings: latestReadings,
        contextUsed: contextPrompt,
      };
    } catch (error) {
      console.error("Gemini model execution error, using deterministic synthesizer:", error);
    }
  }

  // Fallback intelligent response generator if Gemini API key is not present
  const fallbackAnswer = generateDeterministicRAGAnswer(question, latestReadings, latestSensors, activeIncidents, recentAlerts, combinedSources);

  return {
    answer: fallbackAnswer,
    sources: combinedSources,
    retrievedReadings: latestReadings,
    contextUsed: contextPrompt,
  };
}

/**
 * High-quality fallback rule-based response generator for offline or non-API key situations
 */
function generateDeterministicRAGAnswer(
  question: string,
  latestReadings: any[],
  latestSensors: any[],
  activeIncidents: any[],
  recentAlerts: any[],
  sources: any[]
): string {
  const q = question.toLowerCase();

  if (latestReadings.length === 0 && latestSensors.length === 0 && sources.length === 0) {
    return "I don't have enough sensor data to answer that.";
  }

  // Specific node question e.g. "NODE-003"
  const nodeMatch = q.match(/node-\d{3}/i);
  if (nodeMatch) {
    const targetId = nodeMatch[0].toUpperCase();
    const reading = latestReadings.find((r) => r.deviceId === targetId);
    const node = latestSensors.find((n) => n.deviceId === targetId);

    if (reading) {
      return `Sensor ${targetId} is currently reporting a temperature of ${reading.temperature}°C, relative humidity of ${reading.humidity}%, smoke level of ${reading.smokeLevel}, and gas level of ${reading.gasLevel}. Flame detection status is ${reading.flameDetected ? "ACTIVE (FLAME DETECTED)" : "Clear"}. Its prototype wildfire risk score is ${reading.riskScore}/100, classified as ${reading.riskLevel}. Contributing risk factors: ${reading.riskReasons?.join(", ") || "Nominal"}.`;
    } else if (node) {
      return `Node ${targetId} (${node.name}) is registered in the system with status ${node.status} and battery voltage ${node.batteryVoltage}V, but no recent sensor telemetry reading was found in the active buffer.`;
    }
  }

  // Highest temperature
  if (q.includes("highest temperature") || q.includes("hottest")) {
    if (latestReadings.length === 0) return "I don't have enough sensor data to answer that.";
    const sorted = [...latestReadings].sort((a, b) => b.temperature - a.temperature);
    const top = sorted[0];
    return `The sensor with the highest temperature is ${top.deviceId} recording ${top.temperature}°C (Humidity: ${top.humidity}%, Risk: ${top.riskLevel} - Score ${top.riskScore}).`;
  }

  // Lowest humidity
  if (q.includes("lowest humidity") || q.includes("driest")) {
    if (latestReadings.length === 0) return "I don't have enough sensor data to answer that.";
    const sorted = [...latestReadings].sort((a, b) => a.humidity - b.humidity);
    const lowest = sorted[0];
    return `The sensor with the lowest humidity is ${lowest.deviceId} recording ${lowest.humidity}% (Temperature: ${lowest.temperature}°C, Risk: ${lowest.riskLevel} - Score ${lowest.riskScore}). Low humidity below 20% severely increases ignition danger.`;
  }

  // Current wildfire risk overall
  if (q.includes("current wildfire risk") || q.includes("overall risk") || q.includes("summary of the current forest")) {
    const critical = latestReadings.filter((r) => r.riskLevel === "CRITICAL");
    const high = latestReadings.filter((r) => r.riskLevel === "HIGH");
    const avgTemp = (latestReadings.reduce((sum, r) => sum + r.temperature, 0) / (latestReadings.length || 1)).toFixed(1);
    const avgHum = (latestReadings.reduce((sum, r) => sum + r.humidity, 0) / (latestReadings.length || 1)).toFixed(1);

    let summary = `Current Forest Conditions Summary:\n- Active reporting nodes: ${latestReadings.length}\n- Average Temperature: ${avgTemp}°C\n- Average Humidity: ${avgHum}%\n- Critical Risk Nodes: ${critical.length} (${critical.map((c) => c.deviceId).join(", ") || "None"})\n- High Risk Nodes: ${high.length} (${high.map((h) => h.deviceId).join(", ") || "None"}).`;
    if (critical.length > 0) {
      summary += `\nALERT: Immediate attention required at ${critical.map((c) => c.deviceId).join(", ")} due to extreme heat, smoke, or flame triggers.`;
    }
    return summary;
  }

  // Offline sensors
  if (q.includes("offline")) {
    const offlineNodes = latestSensors.filter((s) => s.status === "OFFLINE");
    if (offlineNodes.length === 0) {
      return "All monitored sensor nodes are currently online and operational.";
    }
    return `Currently offline sensors (${offlineNodes.length}): ${offlineNodes.map((n) => `${n.deviceId} (${n.name})`).join(", ")}. Last seen telemetry should be inspected.`;
  }

  // Low humidity explanation
  if (q.includes("low humidity") && (q.includes("dangerous") || q.includes("why") || q.includes("increase"))) {
    return "Low relative humidity (especially below 20-30%) dries out fine forest fuels, leaves, and pine needles rapidly through transpiration. When dead vegetation moisture drops below critical thresholds (equilibrium moisture content), the energy required to ignite and sustain a wildfire drops significantly, allowing flames to ignite from minor sparks and propagate rapidly.";
  }

  // Alerts & incidents
  if (q.includes("alert") || q.includes("incident") || q.includes("latest alert")) {
    if (recentAlerts.length > 0) {
      const topAlert = recentAlerts[0];
      return `Latest Alert for ${topAlert.deviceId}: [${topAlert.severity}] ${topAlert.message} (Logged at ${new Date(topAlert.createdAt).toLocaleTimeString()}). Active incidents logged: ${activeIncidents.length}.`;
    }
  }

  // If we have vector sources matching knowledge
  if (sources.length > 0) {
    return `Based on system knowledge base: ${sources[0].document}`;
  }

  return "I don't have enough sensor data to answer that.";
}
