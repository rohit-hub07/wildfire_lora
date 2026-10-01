# 🌲 Wildfire RAG: IoT Wildfire Monitoring and Alert System

An end-to-end, production-grade wildfire detection and real-time intelligence system powered by **ESP32 LoRa sensor nodes**, **Next.js 16+ App Router**, **MongoDB with Mongoose**, **ChromaDB Vector Retrieval**, and **Gemini 1.5 Flash / Embeddings**.

---

## 🏛 System Architecture

```
ESP32 Sensor Nodes (DHT22, MQ-2, Flame, BME688)
               ↓ (Sub-GHz LoRa Packet)
          LoRa Gateway
               ↓ (HTTP POST JSON payload)
   Next.js API (/api/sensors/data)
               ↓
    MongoDB (Source of Truth)
               ↓
     Risk Analysis Engine
               ↓
 Convert telemetry into natural-language docs
               ↓
    Gemini Text Embeddings (004)
               ↓
          ChromaDB (Vector Retrieval)
               ↓
    RAG Retrieval Pipeline (MongoDB + ChromaDB)
               ↓
        Gemini 1.5 Flash AI
               ↓
    Real-Time Dashboard & AI Chatbot
```

---

## 🚀 Key Features

1. **LoRa Sensor Ingestion & Validation** (`POST /api/sensors/data`):
   - Ingests environmental telemetry: temperature, humidity, MQ-2 smoke, gas concentration, optical flame detection, barometric pressure, battery voltage, and RSSI.
   - Comprehensive input validation.
2. **Deterministic Wildfire Risk Scoring Engine** (`lib/riskAnalysis.ts`):
   - Multi-parameter weighted algorithm evaluating temperature, humidity, smoke, gas, and flame detection into risk scores (`LOW`, `MODERATE`, `HIGH`, `CRITICAL`).
   - *Disclaimer:* Prototype risk-scoring algorithm.
3. **MongoDB + Mongoose Data Models**:
   - `SensorNode`: Sensor node registry, status, battery, geographic location.
   - `SensorReading`: Raw telemetry with compound indexes on `{ deviceId: 1, timestamp: -1 }`.
   - `FireIncident`: Real-time and historical fire incidents.
   - `Alert`: Triggered threat alerts with acknowledgment lifecycle.
   - `KnowledgeDocument`: Hardware specifications and wildfire behavior rules.
4. **Vector Memory & RAG Retrieval** (`lib/chroma.ts`, `lib/rag.ts`):
   - Natural-language document conversion of critical events.
   - ChromaDB vector storage with fallback in-memory cosine similarity engine.
   - Gemini `text-embedding-004` and `gemini-1.5-flash` model integration.
   - Grounded RAG: Current queries query MongoDB directly, historical telemetry queries ChromaDB + MongoDB, hardware queries retrieve Chroma knowledge docs. Hallucination-proof with fallback: `"I don't have enough sensor data to answer that."`
5. **Real-time Mission Dashboard** (`/dashboard`):
   - KPIs: Total, Online/Offline, Normal, High-Risk, Critical sensors, Active Alerts, Avg Temp/Humidity.
   - Real-time Server-Sent Events (SSE) live updates (`/api/events`).
   - Interactive Recharts trend charts (Temperature, Humidity, Smoke, Gas, Risk Score).
   - Topographic Map with interactive radar and sensor risk status.
   - Live Threat Alert and incident feed with acknowledgment buttons.
6. **ChatGPT-Style Ranger Chatbot** (`/chat`):
   - Instant suggested prompt chips.
   - Transparent vector citation drawer showing retrieved ChromaDB documents and similarity scores.

---

## 🛠 Tech Stack

- **Framework:** Next.js 16+ (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS (Dark Ops Theme)
- **Database:** MongoDB via Mongoose
- **Vector Database:** ChromaDB
- **AI & Embeddings:** `@google/generative-ai` (Gemini 1.5 Flash & text-embedding-004)
- **Visualization:** Recharts & Lucide Icons

---

## ⚙️ Environment Configuration

Create a `.env.local` file in the root directory:

```env
MONGODB_URI=mongodb://127.0.0.1:27017/wildfire_rag
GEMINI_API_KEY=your_gemini_api_key_here
CHROMA_URL=http://localhost:8000
```

---

## 📦 Installation & Setup

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Seed Knowledge Base into MongoDB & ChromaDB:**
   ```bash
   npm run seed-knowledge
   ```

3. **Generate 24-Hour Historical Demo Dataset:**
   ```bash
   npm run generate-demo
   ```

4. **Start the Development Server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📡 ESP32 & LoRa Gateway Integration

### LoRa Gateway JSON Payload Format

The LoRa gateway forwards received packet payloads via HTTP POST to:

```http
POST /api/sensors/data
Content-Type: application/json
```

```json
{
  "deviceId": "NODE-001",
  "timestamp": "2026-09-30T09:30:00Z",
  "location": {
    "latitude": 26.1445,
    "longitude": 91.7362
  },
  "temperature": 42.7,
  "humidity": 18.4,
  "smokeLevel": 735,
  "gasLevel": 612,
  "flameDetected": false,
  "pressure": 1007.4,
  "airQuality": 168,
  "batteryVoltage": 8.7,
  "signalStrength": -72
}
```

### Critical Event Example:

```json
{
  "deviceId": "NODE-003",
  "timestamp": "2026-09-30T09:32:00Z",
  "location": {
    "latitude": 26.1492,
    "longitude": 91.7483
  },
  "temperature": 49.6,
  "humidity": 11.7,
  "smokeLevel": 942,
  "gasLevel": 781,
  "flameDetected": true,
  "pressure": 1004.8,
  "airQuality": 287,
  "batteryVoltage": 8.4,
  "signalStrength": -81
}
```

---

## 🔌 API Endpoints Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/sensors/data` | Ingest and validate LoRa sensor readings, compute risk, create alerts, vectorize to ChromaDB |
| `GET` | `/api/sensors` | List all registered sensor nodes |
| `GET` | `/api/sensors/latest` | Retrieve latest reading for each sensor node |
| `GET` | `/api/sensors/[deviceId]` | Get details and latest telemetry for a specific node |
| `GET` | `/api/sensors/[deviceId]/readings` | Get historical sensor readings for a specific device |
| `GET` | `/api/alerts` | Get active alerts (`?acknowledged=false`) |
| `PATCH` | `/api/alerts` | Acknowledge alert |
| `GET` | `/api/incidents` | List fire incidents |
| `POST` | `/api/chat` | RAG Chat endpoint querying MongoDB and ChromaDB with Gemini |
| `GET` | `/api/dashboard/stats` | KPI summary metrics for dashboard |
| `GET` | `/api/dashboard/chart-data` | Time-series telemetry points for Recharts |
| `GET` | `/api/events` | Real-time Server-Sent Events (SSE) telemetry stream |

---

## 🛡 Verification & Testing

Compile and check types:
```bash
npm run build
```
