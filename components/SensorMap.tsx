"use client";

import React, { useEffect, useState } from "react";
import { SensorCardData } from "./SensorCard";
import { MapPin, Flame, AlertCircle, ShieldAlert, Radio } from "lucide-react";

interface SensorMapProps {
  sensors: SensorCardData[];
  selectedDeviceId?: string;
  onSelectSensor?: (deviceId: string) => void;
}

export const SensorMap: React.FC<SensorMapProps> = ({
  sensors,
  selectedDeviceId,
  onSelectSensor,
}) => {
  // Determine bounding box coordinates or use default center
  // Center roughly on Assam Forest Ridge: 26.1445, 91.7362
  const centerLat = 26.1445;
  const centerLng = 91.7362;

  // Normalized coordinate projection for clean, 100% stable SVG forest topographic view
  // Latitude span ~ 26.1200 to 26.1650, Longitude span ~ 91.7150 to 91.7700
  const minLat = 26.12;
  const maxLat = 26.165;
  const minLng = 91.715;
  const maxLng = 91.77;

  const project = (lat: number, lng: number) => {
    const x = ((lng - minLng) / (maxLng - minLng)) * 100;
    const y = 100 - ((lat - minLat) / (maxLat - minLat)) * 100;
    return {
      x: Math.max(5, Math.min(95, x)),
      y: Math.max(5, Math.min(95, y)),
    };
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur-md p-5 shadow-xl flex flex-col h-full">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-orange-400" />
          <h2 className="text-base font-bold text-slate-100">Topographic Sensor Map</h2>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-slate-400">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500" /> Normal
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-orange-500" /> High
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-500" /> Critical
          </span>
        </div>
      </div>

      {/* Interactive SVG Topo Map */}
      <div className="relative w-full h-80 bg-slate-950 rounded-xl overflow-hidden border border-slate-800 shadow-inner">
        {/* Topographic Contours background illustration */}
        <svg className="absolute inset-0 w-full h-full opacity-20 pointer-events-none">
          <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
            <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#334155" strokeWidth="0.5" />
          </pattern>
          <rect width="100%" height="100%" fill="url(#grid)" />
          {/* Contour elevation curves */}
          <path
            d="M 10 90 Q 90 20 200 150 T 400 120"
            fill="none"
            stroke="#10b981"
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />
          <path
            d="M 50 250 Q 150 180 300 220 T 550 170"
            fill="none"
            stroke="#10b981"
            strokeWidth="1.2"
          />
          <path
            d="M 0 50 Q 250 100 500 40"
            fill="none"
            stroke="#3b82f6"
            strokeWidth="1.5"
          />
        </svg>

        {/* Radar Scanning sweep effect */}
        <div className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none">
          <div className="w-full h-full bg-gradient-to-b from-emerald-500/5 via-transparent to-transparent animate-pulse" />
        </div>

        {/* LoRa Gateway Tower Marker */}
        <div
          className="absolute transform -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center pointer-events-none"
          style={{ left: "50%", top: "48%" }}
        >
          <div className="p-1.5 rounded-full bg-blue-500/20 border border-blue-400 text-blue-400 animate-pulse">
            <Radio className="w-4 h-4" />
          </div>
          <span className="text-[9px] font-mono font-bold text-blue-300 bg-slate-950/80 px-1 rounded border border-blue-900 mt-0.5">
            LoRa Gateway
          </span>
        </div>

        {/* Sensor Node Markers */}
        {sensors.map((sensor) => {
          const lat = sensor.location?.latitude || centerLat;
          const lng = sensor.location?.longitude || centerLng;
          const pos = project(lat, lng);

          const isCritical = sensor.riskLevel === "CRITICAL" || sensor.flameDetected;
          const isHigh = sensor.riskLevel === "HIGH";
          const isSelected = selectedDeviceId === sensor.deviceId;

          return (
            <div
              key={sensor.deviceId}
              onClick={() => onSelectSensor && onSelectSensor(sensor.deviceId)}
              style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
              className={`absolute transform -translate-x-1/2 -translate-y-1/2 z-20 cursor-pointer group transition-all duration-300 ${
                isSelected ? "scale-125 z-30" : "hover:scale-110"
              }`}
            >
              {/* Pulsing ring for critical sensors */}
              {isCritical && (
                <span className="absolute -inset-2 rounded-full bg-red-500/50 animate-ping" />
              )}

              {/* Marker Pin */}
              <div
                className={`relative p-2 rounded-full border shadow-2xl flex items-center justify-center ${
                  isCritical
                    ? "bg-red-600 border-red-300 text-white critical-glow"
                    : isHigh
                    ? "bg-orange-500 border-orange-200 text-white"
                    : sensor.status === "OFFLINE"
                    ? "bg-slate-700 border-slate-500 text-slate-400"
                    : "bg-emerald-600 border-emerald-300 text-white"
                }`}
              >
                {isCritical ? (
                  <Flame className="w-3.5 h-3.5 fill-current" />
                ) : (
                  <MapPin className="w-3.5 h-3.5" />
                )}
              </div>

              {/* Tooltip Card on Hover */}
              <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:flex flex-col bg-slate-900 border border-slate-700 text-white text-[11px] p-2.5 rounded-lg shadow-2xl whitespace-nowrap z-40 pointer-events-none min-w-[150px]">
                <div className="font-bold flex items-center justify-between border-b border-slate-800 pb-1 mb-1">
                  <span>{sensor.deviceId}</span>
                  <span
                    className={`font-mono font-bold ${
                      isCritical ? "text-red-400" : isHigh ? "text-orange-400" : "text-emerald-400"
                    }`}
                  >
                    {sensor.riskLevel} ({sensor.riskScore})
                  </span>
                </div>
                <div className="text-slate-300 space-y-0.5 font-mono text-[10px]">
                  <div>Temp: {sensor.temperature.toFixed(1)}°C</div>
                  <div>Humidity: {sensor.humidity.toFixed(1)}%</div>
                  <div>Smoke: {sensor.smokeLevel} | Gas: {sensor.gasLevel}</div>
                  <div>Flame: {sensor.flameDetected ? "YES" : "NO"}</div>
                </div>
              </div>

              {/* Label below marker */}
              <div className="text-[10px] font-mono font-bold text-slate-200 bg-slate-950/90 px-1.5 py-0.5 rounded border border-slate-800 mt-1 whitespace-nowrap text-center shadow">
                {sensor.deviceId}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
