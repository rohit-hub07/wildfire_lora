"use client";

import React from "react";
import { SensorCardData } from "./SensorCard";
import { RiskIndicator } from "./RiskIndicator";
import { Flame, Battery, ShieldAlert, CheckCircle2 } from "lucide-react";

interface SensorTableProps {
  sensors: SensorCardData[];
  onSelectSensor?: (deviceId: string) => void;
  selectedDeviceId?: string;
}

export const SensorTable: React.FC<SensorTableProps> = ({
  sensors,
  onSelectSensor,
  selectedDeviceId,
}) => {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur-md">
      <table className="w-full text-left text-xs border-collapse">
        <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
          <tr>
            <th className="px-4 py-3">Device</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Temperature</th>
            <th className="px-4 py-3">Humidity</th>
            <th className="px-4 py-3">Smoke (MQ-2)</th>
            <th className="px-4 py-3">Gas Level</th>
            <th className="px-4 py-3">Flame</th>
            <th className="px-4 py-3">Risk Assessment</th>
            <th className="px-4 py-3">Battery</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/60 text-slate-200">
          {sensors.map((s) => {
            const isSelected = selectedDeviceId === s.deviceId;
            const isCritical = s.riskLevel === "CRITICAL" || s.flameDetected;

            return (
              <tr
                key={s.deviceId}
                onClick={() => onSelectSensor && onSelectSensor(s.deviceId)}
                className={`transition-colors cursor-pointer ${
                  isSelected
                    ? "bg-orange-500/10 hover:bg-orange-500/15"
                    : isCritical
                    ? "bg-red-950/30 hover:bg-red-950/40"
                    : "hover:bg-slate-800/40"
                }`}
              >
                {/* Device */}
                <td className="px-4 py-3 font-medium">
                  <div className="flex flex-col">
                    <span className="font-mono font-bold text-slate-100">{s.deviceId}</span>
                    <span className="text-[10px] text-slate-400 truncate max-w-[130px]">
                      {s.name || `Node ${s.deviceId}`}
                    </span>
                  </div>
                </td>

                {/* Status */}
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono uppercase font-semibold ${
                      s.status === "ONLINE"
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                        : s.status === "OFFLINE"
                        ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                        : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        s.status === "ONLINE" ? "bg-emerald-400" : "bg-rose-400"
                      }`}
                    />
                    {s.status || "ONLINE"}
                  </span>
                </td>

                {/* Temperature */}
                <td className="px-4 py-3 font-mono font-medium">
                  <span
                    className={
                      s.temperature > 40
                        ? "text-red-400 font-bold"
                        : s.temperature > 30
                        ? "text-amber-400 font-semibold"
                        : "text-slate-200"
                    }
                  >
                    {s.temperature.toFixed(1)}°C
                  </span>
                </td>

                {/* Humidity */}
                <td className="px-4 py-3 font-mono font-medium">
                  <span
                    className={
                      s.humidity < 20
                        ? "text-red-400 font-bold"
                        : s.humidity < 40
                        ? "text-amber-400 font-semibold"
                        : "text-cyan-300"
                    }
                  >
                    {s.humidity.toFixed(1)}%
                  </span>
                </td>

                {/* Smoke */}
                <td className="px-4 py-3 font-mono">
                  <span
                    className={
                      s.smokeLevel > 800
                        ? "text-red-400 font-bold"
                        : s.smokeLevel > 500
                        ? "text-orange-400 font-semibold"
                        : "text-slate-300"
                    }
                  >
                    {s.smokeLevel}
                  </span>
                </td>

                {/* Gas */}
                <td className="px-4 py-3 font-mono">
                  <span
                    className={
                      s.gasLevel > 700
                        ? "text-red-400 font-bold"
                        : s.gasLevel > 500
                        ? "text-orange-400"
                        : "text-slate-300"
                    }
                  >
                    {s.gasLevel}
                  </span>
                </td>

                {/* Flame */}
                <td className="px-4 py-3">
                  {s.flameDetected ? (
                    <span className="inline-flex items-center gap-1 text-red-400 font-bold bg-red-950/60 px-2 py-0.5 rounded border border-red-500/60 animate-pulse">
                      <Flame className="w-3.5 h-3.5 fill-red-500 text-red-500" />
                      FLAME
                    </span>
                  ) : (
                    <span className="text-slate-500 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-slate-600" />
                      Clear
                    </span>
                  )}
                </td>

                {/* Risk */}
                <td className="px-4 py-3">
                  <RiskIndicator score={s.riskScore} level={s.riskLevel} />
                </td>

                {/* Battery */}
                <td className="px-4 py-3 font-mono">
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <Battery
                      className={`w-3.5 h-3.5 ${
                        (s.batteryVoltage ?? 3.7) < 3.3 ? "text-rose-400" : "text-emerald-400"
                      }`}
                    />
                    <span>{s.batteryVoltage ?? 3.7}V</span>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
