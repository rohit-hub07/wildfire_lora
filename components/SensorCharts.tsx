"use client";

import React, { useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import { Thermometer, Droplets, Wind, Activity, Flame, ShieldAlert } from "lucide-react";

export interface TelemetryPoint {
  id?: string;
  deviceId: string;
  timestamp: string | Date;
  time: string;
  temperature: number;
  humidity: number;
  smokeLevel: number;
  gasLevel: number;
  flameDetected: boolean;
  riskScore: number;
  riskLevel: string;
}

interface SensorChartsProps {
  data: TelemetryPoint[];
  selectedDevice?: string;
  onDeviceChange?: (deviceId: string) => void;
  availableDevices?: string[];
}

export const SensorCharts: React.FC<SensorChartsProps> = ({
  data,
  selectedDevice,
  onDeviceChange,
  availableDevices = [],
}) => {
  const [activeTab, setActiveTab] = useState<"all" | "temperature" | "humidity" | "smoke" | "risk">("all");

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const p = payload[0].payload;
      return (
        <div className="bg-slate-900 border border-slate-700 p-3 rounded-lg shadow-2xl text-xs space-y-1">
          <div className="font-bold text-slate-200 border-b border-slate-800 pb-1 flex justify-between gap-4">
            <span>{p.deviceId}</span>
            <span className="text-slate-400">{p.time}</span>
          </div>
          <div className="text-rose-400">Temperature: {p.temperature}°C</div>
          <div className="text-cyan-400">Humidity: {p.humidity}%</div>
          <div className="text-amber-400">Smoke (MQ-2): {p.smokeLevel}</div>
          <div className="text-purple-400">Gas: {p.gasLevel}</div>
          <div className="text-red-400 font-semibold">
            Risk Score: {p.riskScore} ({p.riskLevel})
          </div>
          {p.flameDetected && (
            <div className="text-red-500 font-bold flex items-center gap-1">
              <Flame className="w-3 h-3" /> FLAME DETECTED
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur-md p-5 shadow-xl">
      {/* Chart Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <Activity className="w-5 h-5 text-orange-400" />
            Environmental Telemetry & Wildfire Risk Trends
          </h2>
          <p className="text-xs text-slate-400">
            Real-time LoRa stream and historical multi-sensor sensor data
          </p>
        </div>

        {/* Device Filter & Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          {availableDevices.length > 0 && onDeviceChange && (
            <select
              value={selectedDevice || ""}
              onChange={(e) => onDeviceChange(e.target.value)}
              className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-orange-500"
            >
              <option value="">All Sensors</option>
              {availableDevices.map((dev) => (
                <option key={dev} value={dev}>
                  {dev}
                </option>
              ))}
            </select>
          )}

          <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => setActiveTab("all")}
              className={`px-2.5 py-1 rounded font-medium transition-all ${
                activeTab === "all" ? "bg-orange-600 text-white" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Combined
            </button>
            <button
              onClick={() => setActiveTab("temperature")}
              className={`px-2.5 py-1 rounded font-medium transition-all ${
                activeTab === "temperature"
                  ? "bg-red-600 text-white"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Temp
            </button>
            <button
              onClick={() => setActiveTab("humidity")}
              className={`px-2.5 py-1 rounded font-medium transition-all ${
                activeTab === "humidity"
                  ? "bg-cyan-600 text-white"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Humidity
            </button>
            <button
              onClick={() => setActiveTab("smoke")}
              className={`px-2.5 py-1 rounded font-medium transition-all ${
                activeTab === "smoke"
                  ? "bg-amber-600 text-white"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Smoke & Gas
            </button>
            <button
              onClick={() => setActiveTab("risk")}
              className={`px-2.5 py-1 rounded font-medium transition-all ${
                activeTab === "risk"
                  ? "bg-rose-600 text-white"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Risk Score
            </button>
          </div>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="h-72 w-full">
        {data.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-500 text-xs">
            No telemetry data points available for the selected range.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            {activeTab === "all" ? (
              <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="time" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }} />
                <Line
                  type="monotone"
                  dataKey="temperature"
                  name="Temperature (°C)"
                  stroke="#ef4444"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="humidity"
                  name="Humidity (%)"
                  stroke="#06b6d4"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="smokeLevel"
                  name="Smoke (MQ-2)"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="riskScore"
                  name="Wildfire Risk Score"
                  stroke="#e11d48"
                  strokeWidth={2.5}
                  strokeDasharray="4 2"
                  dot={false}
                />
              </LineChart>
            ) : activeTab === "temperature" ? (
              <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="time" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} domain={["dataMin - 5", "dataMax + 5"]} />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="temperature"
                  name="Temperature (°C)"
                  stroke="#ef4444"
                  fillOpacity={1}
                  fill="url(#tempGradient)"
                />
              </AreaChart>
            ) : activeTab === "humidity" ? (
              <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="humGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="time" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} domain={[0, 100]} />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="humidity"
                  name="Humidity (%)"
                  stroke="#06b6d4"
                  fillOpacity={1}
                  fill="url(#humGradient)"
                />
              </AreaChart>
            ) : activeTab === "smoke" ? (
              <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="smokeGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="time" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="smokeLevel"
                  name="Smoke"
                  stroke="#f59e0b"
                  fillOpacity={1}
                  fill="url(#smokeGradient)"
                />
                <Area
                  type="monotone"
                  dataKey="gasLevel"
                  name="Gas"
                  stroke="#a855f7"
                  fillOpacity={0.3}
                  fill="#a855f7"
                />
              </AreaChart>
            ) : (
              <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="riskGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#dc2626" stopOpacity={0.9} />
                    <stop offset="95%" stopColor="#dc2626" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="time" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} domain={[0, 100]} />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="riskScore"
                  name="Wildfire Risk Score"
                  stroke="#ef4444"
                  fillOpacity={1}
                  fill="url(#riskGradient)"
                />
              </AreaChart>
            )}
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};
