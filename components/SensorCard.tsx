"use client";

import React from "react";
import {
  Thermometer,
  Droplets,
  Wind,
  Flame,
  Activity,
  Battery,
  Radio,
  Clock,
  MapPin,
} from "lucide-react";
import { RiskIndicator } from "./RiskIndicator";

export interface SensorCardData {
  deviceId: string;
  name?: string;
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
  status?: string;
  timestamp?: string | Date;
  location?: { latitude: number; longitude: number };
}

interface SensorCardProps {
  sensor: SensorCardData;
  onSelect?: (deviceId: string) => void;
  isSelected?: boolean;
}

export const SensorCard: React.FC<SensorCardProps> = ({
  sensor,
  onSelect,
  isSelected = false,
}) => {
  const isOffline = sensor.status === "OFFLINE";
  const isCritical = sensor.riskLevel === "CRITICAL" || sensor.flameDetected;

  return (
    <div
      onClick={() => onSelect && onSelect(sensor.deviceId)}
      className={`relative rounded-xl p-5 border transition-all duration-300 cursor-pointer ${
        isSelected
          ? "border-orange-500 bg-slate-900/95 ring-2 ring-orange-500/30"
          : isCritical
          ? "border-red-600/70 bg-red-950/20 hover:border-red-500 critical-glow"
          : isOffline
          ? "border-slate-800 bg-slate-950/60 opacity-70"
          : "border-slate-800/80 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900/90"
      } backdrop-blur-md shadow-xl flex flex-col justify-between`}
    >
      {/* Top Bar: Device Name & Status */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <div
              className={`p-2 rounded-lg ${
                isCritical
                  ? "bg-red-500/20 text-red-400"
                  : isOffline
                  ? "bg-slate-800 text-slate-500"
                  : "bg-emerald-500/20 text-emerald-400"
              }`}
            >
              <Radio className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-sm">{sensor.deviceId}</h3>
              <p className="text-xs text-slate-400 truncate max-w-[140px]">
                {sensor.name || `Node ${sensor.deviceId}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider font-semibold ${
                sensor.status === "ONLINE"
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  : sensor.status === "OFFLINE"
                  ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                  : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
              }`}
            >
              {sensor.status || "ONLINE"}
            </span>
          </div>
        </div>

        {/* Risk Indicator Component */}
        <div className="mb-4">
          <RiskIndicator
            score={sensor.riskScore}
            level={sensor.riskLevel}
            reasons={sensor.riskReasons}
            showReasons={false}
          />
        </div>

        {/* Telemetry Grid */}
        <div className="grid grid-cols-2 gap-2.5 my-3">
          <div className="bg-slate-950/50 rounded-lg p-2.5 border border-slate-800/60 flex items-center gap-2.5">
            <Thermometer
              className={`w-4 h-4 ${
                sensor.temperature > 40
                  ? "text-red-400"
                  : sensor.temperature > 30
                  ? "text-amber-400"
                  : "text-blue-400"
              }`}
            />
            <div>
              <div className="text-[10px] uppercase text-slate-400 font-medium">Temperature</div>
              <div className="text-base font-bold text-slate-100 font-mono">
                {sensor.temperature.toFixed(1)}°C
              </div>
            </div>
          </div>

          <div className="bg-slate-950/50 rounded-lg p-2.5 border border-slate-800/60 flex items-center gap-2.5">
            <Droplets
              className={`w-4 h-4 ${
                sensor.humidity < 20
                  ? "text-red-400"
                  : sensor.humidity < 40
                  ? "text-amber-400"
                  : "text-cyan-400"
              }`}
            />
            <div>
              <div className="text-[10px] uppercase text-slate-400 font-medium">Humidity</div>
              <div className="text-base font-bold text-slate-100 font-mono">
                {sensor.humidity.toFixed(1)}%
              </div>
            </div>
          </div>

          <div className="bg-slate-950/50 rounded-lg p-2.5 border border-slate-800/60 flex items-center gap-2.5">
            <Wind
              className={`w-4 h-4 ${
                sensor.smokeLevel > 500 ? "text-red-400" : "text-slate-400"
              }`}
            />
            <div>
              <div className="text-[10px] uppercase text-slate-400 font-medium">Smoke (MQ-2)</div>
              <div className="text-base font-bold text-slate-100 font-mono">
                {sensor.smokeLevel}
              </div>
            </div>
          </div>

          <div className="bg-slate-950/50 rounded-lg p-2.5 border border-slate-800/60 flex items-center gap-2.5">
            <Activity
              className={`w-4 h-4 ${
                sensor.gasLevel > 500 ? "text-orange-400" : "text-slate-400"
              }`}
            />
            <div>
              <div className="text-[10px] uppercase text-slate-400 font-medium">Gas Level</div>
              <div className="text-base font-bold text-slate-100 font-mono">
                {sensor.gasLevel}
              </div>
            </div>
          </div>
        </div>

        {/* Flame Detection Banner */}
        <div
          className={`flex items-center justify-between p-2 rounded-lg text-xs font-semibold mb-2 ${
            sensor.flameDetected
              ? "bg-red-500/30 text-red-200 border border-red-500 animate-pulse"
              : "bg-slate-950/40 text-slate-400 border border-slate-800/50"
          }`}
        >
          <div className="flex items-center gap-1.5">
            <Flame
              className={`w-3.5 h-3.5 ${
                sensor.flameDetected ? "text-red-400 fill-red-500" : "text-slate-500"
              }`}
            />
            <span>Flame Sensor:</span>
          </div>
          <span className={sensor.flameDetected ? "text-red-400 font-bold" : "text-slate-400"}>
            {sensor.flameDetected ? "FLAME DETECTED" : "Clear"}
          </span>
        </div>
      </div>

      {/* Footer Info: Battery, RSSI, Timestamp */}
      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <Battery
              className={`w-3.5 h-3.5 ${
                (sensor.batteryVoltage ?? 3.7) < 3.3 ? "text-rose-400" : "text-slate-400"
              }`}
            />
            <span>{sensor.batteryVoltage ?? 3.7}V</span>
          </div>
          {sensor.signalStrength !== undefined && (
            <div className="flex items-center gap-1">
              <Radio className="w-3.5 h-3.5 text-slate-400" />
              <span>{sensor.signalStrength} dBm</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 text-[10px] text-slate-500">
          <Clock className="w-3 h-3" />
          <span>
            {sensor.timestamp ? new Date(sensor.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Live"}
          </span>
        </div>
      </div>
    </div>
  );
};
