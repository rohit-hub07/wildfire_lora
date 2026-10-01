import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { connectToDatabase } from "../lib/mongodb";
import { KnowledgeDocument } from "../models/KnowledgeDocument";
import { addDocumentToVectorStore, KNOWLEDGE_COLLECTION_NAME } from "../lib/chroma";

const KNOWLEDGE_ITEMS = [
  {
    title: "DHT22 Temperature and Humidity Sensor Overview",
    category: "Hardware",
    source: "Hardware Engineering Spec",
    content: `The DHT22 (AM2302) is a high-precision digital sensor designed for measuring ambient temperature and relative humidity.
Operating Range: -40°C to 80°C for temperature (accuracy ±0.5°C) and 0% to 100% RH for humidity (accuracy ±2-5% RH).
Interface: Single-bus digital signal. In wildfire monitoring deployments, DHT22 tracks sudden microclimate spikes and extreme relative humidity depressions. Relative humidity dropping below 20% along with temperature exceeding 40°C creates high flashpoint conditions for forest biomass.`,
  },
  {
    title: "MQ-2 Smoke and Combustible Gas Sensor Overview",
    category: "Hardware",
    source: "Hardware Engineering Spec",
    content: `The MQ-2 is a metal oxide semiconductor (MOS) gas sensor sensitive to smoke, LPG, Propane, Methane, Alcohol, and Hydrogen.
Operating Mechanism: The tin dioxide (SnO2) sensitive layer has lower conductivity in clean air. When combustible gases or dense smoke particles contact the sensor heating grid, conductivity increases proportional to gas concentration.
Thresholds: Clean forest air baseline is typically 50-180 ppm equivalent. Values between 200-500 ppm indicate moderate haze/smoke drift. Values above 500 indicate nearby pyrolysis or active smoldering, and values exceeding 800 indicate direct fire proximity.`,
  },
  {
    title: "Optical Flame Sensor (IR Phototransistor/Receiver)",
    category: "Hardware",
    source: "Hardware Engineering Spec",
    content: `The optical flame detection module uses an infrared receiver sensitive to light wavelengths between 760 nm and 1100 nm, corresponding to the emission spectrum of open hydrocarbon and wood combustion flames.
Detection Angle: Approximately 60 degrees directional cone.
Detection Range: 20 cm up to several meters depending on fire size and line of sight.
Behavior in System: A digital HIGH on flame detection overrides standard gradual risk escalations, immediately driving the prototype risk score to CRITICAL (90+) and generating emergency alerts.`,
  },
  {
    title: "Bosch BME688 Environmental Gas and Barometric Sensor",
    category: "Hardware",
    source: "Hardware Engineering Spec",
    content: `The Bosch BME688 is an advanced MEMS sensor integrating high-accuracy barometric pressure, ambient temperature, relative humidity, and AI-enabled volatile organic compound (VOC) / gas sensing.
Barometric Pressure Range: 300 to 1100 hPa. Rapid barometric pressure drops often precede severe wind gusts or convective wildfire storm formation (pyrocumulonimbus).
Air Quality Index (AQI): Scored 0-500. Wildfire smoke plumes containing high VOCs, soot particles, and carbon monoxide drive AQI above 200 (Hazardous).`,
  },
  {
    title: "ESP32 Microcontroller Platform",
    category: "Hardware",
    source: "Hardware Engineering Spec",
    content: `The ESP32 is a low-power dual-core 32-bit Xtensa LX6 microcontroller operating up to 240 MHz with built-in Wi-Fi and Bluetooth BLE.
In wildland IoT nodes, the ESP32 operates primarily in Ultra-Low Power (ULP) Deep Sleep mode to conserve battery life, waking up periodically (e.g., every 60-300 seconds) or when interrupt triggers fire (such as sudden flame detection or analog threshold breach). It interfaces via SPI with the LoRa transceiver module.`,
  },
  {
    title: "LoRa and LoRaWAN Long-Range Communication Protocol",
    category: "Communication",
    source: "IoT Networking Guide",
    content: `LoRa (Long Range) is a physical proprietary radio modulation technology based on Chirp Spread Spectrum (CSS) techniques operating in sub-GHz ISM bands (868 MHz in EU, 915 MHz in US/India).
Key Benefits for Wildfire Networks:
1. Extreme range: 5 to 15+ km line-of-sight in rugged forest terrain and dense canopies.
2. High penetration through tree trunks and topography.
3. Low power consumption: enables multi-year autonomous node operation on 18650 Li-ion batteries with solar recharge panels.
Data packets are transmitted from sensor nodes to a centralized LoRa Gateway, which relays the telemetry to the Next.js cloud backend via 4G/LTE or satellite backhaul.`,
  },
  {
    title: "Wildfire Environmental Risk Factors and Fire Weather",
    category: "Fire Science",
    source: "Wildland Fire Science Handbook",
    content: `Wildfire ignition and rapid rate of spread depend on three key environmental factors (the Fire Behavior Triangle): Fuel, Weather, and Topography.
1. Fuel Moisture: Governed by ambient temperature and relative humidity (RH). When RH drops below 20%, 1-hour and 10-hour fine fuels (twigs, dried pine needles, grasses) lose moisture rapidly, becoming highly ignitable.
2. Ambient Temperature: Temperatures exceeding 38°C pre-heat fuels, lowering the ignition energy required.
3. Smoke and Volatiles: Smoldering biomass releases terpenes, carbon monoxide, and volatile hydrocarbon vapors before open combustion occurs. Detecting elevated smoke (MQ-2 > 500) and gas spikes provides crucial early warning before visible open canopy flames develop.`,
  },
  {
    title: "System Sensor Thresholds and Risk Scoring Rules",
    category: "System Rules",
    source: "Wildfire RAG System Configuration",
    content: `The prototype Wildfire Risk Analysis Engine evaluates real-time sensor parameters against weighted risk bands:
- Temperature (°C): <30 (Low, 5pts), 30-38 (Moderate, 15pts), 38-45 (High, 25pts), >45 (Very High, 35pts).
- Humidity (%): >60 (Low, 0pts), 40-60 (Moderate, 10pts), 20-40 (High, 20pts), <20 (Very High, 30pts).
- Smoke Level (raw analog MQ-2): <200 (Low, 0pts), 200-500 (Moderate, 10pts), 500-800 (High, 20pts), >800 (Very High, 30pts).
- Gas Concentration: <300 (Low, 0pts), 300-500 (Moderate, 8pts), 500-700 (High, 15pts), >700 (Very High, 25pts).
- Flame Detection: When TRUE, adds +45pts immediately.
Classification: Total Score <50 = LOW/MODERATE, 75-89 = HIGH, 90-100 or Flame Detected = CRITICAL.`,
  },
  {
    title: "End-to-End System Architecture and Data Pipeline",
    category: "Architecture",
    source: "System Architecture Document",
    content: `The Wildfire RAG IoT platform architecture consists of:
1. Edge Layer: ESP32 sensor nodes equipped with DHT22, MQ-2, Flame, and BME688 sensors.
2. Transport Layer: Sub-GHz LoRa modulation transmitting compressed JSON packets to an outdoor LoRa Gateway.
3. Ingestion Layer: Next.js API route POST /api/sensors/data validates incoming payloads and executes risk scoring.
4. Storage Layer: MongoDB persists raw sensor readings, active alerts, fire incidents, and sensor metadata as the source of truth.
5. Vector Layer: High-risk and telemetry events are converted into natural-language narrative chunks, vectorized via Gemini Embeddings, and indexed into ChromaDB.
6. Intelligence & UI Layer: Real-time Next.js App Router dashboard with Server-Sent Events (SSE) updates, Recharts telemetry visualizations, interactive map, and RAG Chatbot powered by Gemini.`,
  },
  {
    title: "Previous Historical Fire Incidents and Post-Incident Analysis",
    category: "Incidents",
    source: "Forestry Historical Incident Logs",
    content: `Historical incident records in Sector Pine-North (NODE-003 region):
- Incident #2026-F01: Occurred in high-canopy ridge following 4 consecutive days of 44°C temperatures and 12% relative humidity. Smoke levels jumped from 140 to 890 within 12 minutes prior to flame detection. Rapid containment was achieved within 35 minutes of the automated CRITICAL alert.
- Lessons Learned: Sustained low humidity (<15%) coupled with rising gas concentrations (>600) represents a reliable 10-20 minute leading indicator before open flame sensor triggering.`,
  },
  {
    title: "Alert Escalation Rules and Ranger Notification Protocol",
    category: "System Rules",
    source: "Standard Operating Procedures",
    content: `When sensor telemetry triggers a HIGH or CRITICAL risk event:
1. CRITICAL Risk (Score >=90 or Flame Detected): Immediate system notification generated, visual strobe banner enabled on dashboard, automated incident logged in MongoDB, and vector memory updated.
2. HIGH Risk (Score 75-89): Warning alert issued, sampling frequency of target sensor node dynamically adjusted to high-rate mode.
3. Offline Sensors: When a node fails to report within 3x the expected heartbeat interval (or battery drops <3.0V), status transitions to OFFLINE or WARNING, prompting field technician battery/antenna inspection.`,
  },
];

async function seedKnowledge() {
  console.log("Seeding Knowledge Base into MongoDB and ChromaDB...");
  await connectToDatabase();

  // Clear existing knowledge documents
  await KnowledgeDocument.deleteMany({});

  for (const item of KNOWLEDGE_ITEMS) {
    const doc = await KnowledgeDocument.create({
      title: item.title,
      content: item.content,
      category: item.category,
      source: item.source,
    });

    const vectorId = `kb_${doc._id.toString()}`;
    const textToEmbed = `Title: ${item.title}\nCategory: ${item.category}\nSource: ${item.source}\nContent:\n${item.content}`;
    const metadata = {
      title: item.title,
      category: item.category,
      source: item.source,
      docId: doc._id.toString(),
    };

    await addDocumentToVectorStore(KNOWLEDGE_COLLECTION_NAME, vectorId, textToEmbed, metadata);
    console.log(` Indexed: ${item.title}`);
  }

  console.log(`Knowledge Base seeding completed! Total documents: ${KNOWLEDGE_ITEMS.length}`);
  process.exit(0);
}

seedKnowledge().catch((err) => {
  console.error("Error seeding knowledge base:", err);
  process.exit(1);
});
