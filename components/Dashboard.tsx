"use client";

import React, { useState, useEffect } from "react";
import { SensorCard, SensorCardData } from "./SensorCard";
import { SensorTable } from "./SensorTable";
import { SensorCharts, TelemetryPoint } from "./SensorCharts";
import { AlertPanel, AlertItem } from "./AlertPanel";
import { SensorMap } from "./SensorMap";
import {
  Flame,
  Radio,
  Thermometer,
  Droplets,
  AlertTriangle,
  Activity,
  ShieldCheck,
  RefreshCw,
  LayoutDashboard,
  MessageSquare,
  Zap,
} from "lucide-react";
import Link from "next/link";

export const Dashboard: React.FC = () => {
  const [sensors, setSensors] = useState<SensorCardData[]>([]);
  const [chartData, setChartData] = useState<TelemetryPoint[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [stats, setStats] = useState<any>({
    totalSensors: 0,
    onlineSensors: 0,
    offlineSensors: 0,
    normalSensors: 0,
    highRiskSensors: 0,
    criticalSensors: 0,
    activeAlerts: 0,
    avgTemperature: 0,
    avgHumidity: 0,
  });
  const [selectedDevice, setSelectedDevice] = useState<string>("");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [simulatingReading, setSimulatingReading] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsRes, latestSensorsRes, chartsRes, alertsRes] = await Promise.all([
        fetch("/api/dashboard/stats"),
        fetch("/api/sensors/latest"),
        fetch(`/api/dashboard/chart-data${selectedDevice ? `?deviceId=${selectedDevice}` : ""}`),
        fetch("/api/alerts"),
      ]);

      const [statsData, latestSensorsData, chartsData, alertsData] = await Promise.all([
        statsRes.json(),
        latestSensorsRes.json(),
        chartsRes.json(),
        alertsRes.json(),
      ]);

      if (statsData.success) setStats(statsData.stats);
      if (latestSensorsData.success) setSensors(latestSensorsData.data);
      if (chartsData.success) setChartData(chartsData.data);
      if (alertsData.success) setAlerts(alertsData.data);

      setLastRefreshed(new Date());
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Server-Sent Events for Real-Time Sensor Telemetry
    const eventSource = new EventSource("/api/events");

    eventSource.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === "SENSOR_READING") {
          fetchData();
        }
      } catch (e) {
        console.error("SSE parse error:", e);
      }
    };

    // Auto polling every 10 seconds as backup
    const interval = setInterval(() => {
      fetchData();
    }, 10000);

    return () => {
      eventSource.close();
      clearInterval(interval);
    };
  }, [selectedDevice]);

  const handleAcknowledgeAlert = async (alertId: string) => {
    try {
      await fetch("/api/alerts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alertId, acknowledged: true }),
      });
      fetchData();
    } catch (e) {
      console.error("Ack alert error:", e);
    }
  };

  // Test live ingestion POST /api/sensors/data
  const handleSimulateIncomingReading = async () => {
    try {
      setSimulatingReading(true);
      const isCritical = Math.random() > 0.6;
      const reading = {
        deviceId: "NODE-003",
        timestamp: new Date().toISOString(),
        location: { latitude: 26.1492, longitude: 91.7483 },
        temperature: isCritical ? 51.2 : 44.8,
        humidity: isCritical ? 9.8 : 16.2,
        smokeLevel: isCritical ? 965 : 780,
        gasLevel: isCritical ? 820 : 640,
        flameDetected: isCritical,
        pressure: 1004.2,
        airQuality: 295,
        batteryVoltage: 8.3,
        signalStrength: -80,
      };

      await fetch("/api/sensors/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reading),
      });

      fetchData();
    } catch (e) {
      console.error("Simulation error:", e);
    } finally {
      setSimulatingReading(false);
    }
  };

  const deviceList = Array.from(new Set(sensors.map((s) => s.deviceId)));

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8">
      {/* Top Navbar */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-orange-600 text-white shadow-lg shadow-orange-600/40">
            <Flame className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-2">
              WILDFIRE RAG
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-orange-950/80 border border-orange-500/40 text-orange-400">
                IoT SENSOR NETWORK
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Assam Protected Forest Reserve • LoRa Telemetry & Real-Time RAG Intelligence
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleSimulateIncomingReading}
            disabled={simulatingReading}
            className="px-3.5 py-2 rounded-xl bg-orange-600/20 hover:bg-orange-600/30 border border-orange-500/40 text-orange-300 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow"
          >
            <Zap className={`w-3.5 h-3.5 ${simulatingReading ? "animate-spin" : ""}`} />
            Simulate LoRa Packet
          </button>

          <button
            onClick={fetchData}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 transition-colors"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-orange-400" : ""}`} />
          </button>

          <Link
            href="/chat"
            className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold flex items-center gap-2 transition-all shadow-lg shadow-orange-600/30"
          >
            <MessageSquare className="w-4 h-4" />
            AI Chatbot Assistant
          </Link>
        </div>
      </header>

      {/* Critical Alert Banner if Critical Sensor exists */}
      {stats.criticalSensors > 0 && (
        <div className="mt-6 p-4 rounded-xl bg-red-950/70 border border-red-500 text-red-100 flex items-center justify-between gap-4 critical-glow">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-600 text-white animate-pulse">
              <Flame className="w-6 h-6 fill-white" />
            </div>
            <div>
              <div className="font-bold text-sm tracking-wide text-red-200">
                EMERGENCY WILDFIRE WARNING IN SECTOR PINE-NORTH
              </div>
              <div className="text-xs text-red-300/90">
                {stats.criticalSensors} sensor node(s) reporting CRITICAL wildfire threshold breaches (Active flame / extreme thermal anomaly).
              </div>
            </div>
          </div>
          <Link
            href="/chat"
            className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold whitespace-nowrap transition-colors"
          >
            Query AI Ranger
          </Link>
        </div>
      )}

      {/* Stats KPI Overview Cards */}
      <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 my-6">
        {/* Total & Online */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Sensors</span>
            <Radio className="w-4 h-4 text-slate-500" />
          </div>
          <div className="text-2xl font-black font-mono text-slate-100">
            {stats.onlineSensors}/{stats.totalSensors}
          </div>
          <div className="text-[10px] text-emerald-400 mt-1 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            {stats.onlineSensors} Online • {stats.offlineSensors} Offline
          </div>
        </div>

        {/* Normal Sensors */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Normal Status</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black font-mono text-emerald-400">
            {stats.normalSensors}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Nominal environmental state</div>
        </div>

        {/* High Risk Sensors */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>High Risk</span>
            <AlertTriangle className="w-4 h-4 text-orange-400" />
          </div>
          <div className="text-2xl font-black font-mono text-orange-400">
            {stats.highRiskSensors}
          </div>
          <div className="text-[10px] text-orange-300/80 mt-1">Elevated thermal / smoke</div>
        </div>

        {/* Critical Sensors */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Critical Risk</span>
            <Flame className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-2xl font-black font-mono text-red-500">
            {stats.criticalSensors}
          </div>
          <div className="text-[10px] text-red-400/80 mt-1">Immediate intervention</div>
        </div>

        {/* Average Temperature */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Avg Temperature</span>
            <Thermometer className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-black font-mono text-slate-100">
            {stats.avgTemperature}°C
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Across active sensors</div>
        </div>

        {/* Average Humidity */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Avg Humidity</span>
            <Droplets className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black font-mono text-slate-100">
            {stats.avgHumidity}%
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Canopy moisture index</div>
        </div>
      </section>

      {/* Main Grid: Charts, Topo Map, Alert Feed */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Environmental Trend Charts (2 Cols) */}
        <div className="lg:col-span-2">
          <SensorCharts
            data={chartData}
            selectedDevice={selectedDevice}
            onDeviceChange={setSelectedDevice}
            availableDevices={deviceList}
          />
        </div>

        {/* Live Alert & Incident Stream (1 Col) */}
        <div className="lg:col-span-1">
          <AlertPanel alerts={alerts} onAcknowledge={handleAcknowledgeAlert} />
        </div>
      </section>

      {/* Topographic Map & Geographic Sensor Placement */}
      <section className="mb-8">
        <SensorMap
          sensors={sensors}
          selectedDeviceId={selectedDevice}
          onSelectSensor={setSelectedDevice}
        />
      </section>

      {/* Sensor Nodes Management List */}
      <section className="space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <Radio className="w-5 h-5 text-orange-400" />
              ESP32 LoRa Sensor Nodes Telemetry
            </h2>
            <p className="text-xs text-slate-400">
              Real-time multi-spectral sensor feeds parsed and validated via LoRa Gateway
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => setViewMode("grid")}
              className={`px-3 py-1 rounded font-medium transition-all ${
                viewMode === "grid"
                  ? "bg-orange-600 text-white"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Cards
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`px-3 py-1 rounded font-medium transition-all ${
                viewMode === "table"
                  ? "bg-orange-600 text-white"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Table
            </button>
          </div>
        </div>

        {viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {sensors.map((sensor) => (
              <SensorCard
                key={sensor.deviceId}
                sensor={sensor}
                isSelected={selectedDevice === sensor.deviceId}
                onSelect={setSelectedDevice}
              />
            ))}
          </div>
        ) : (
          <SensorTable
            sensors={sensors}
            selectedDeviceId={selectedDevice}
            onSelectSensor={setSelectedDevice}
          />
        )}
      </section>
    </div>
  );
};
