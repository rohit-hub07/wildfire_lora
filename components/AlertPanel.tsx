"use client";

import React from "react";
import { AlertTriangle, Flame, BellRing, Check, ShieldAlert, Clock } from "lucide-react";

export interface AlertItem {
  _id: string;
  deviceId: string;
  type: string;
  severity: "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
  message: string;
  acknowledged: boolean;
  createdAt: string | Date;
}

interface AlertPanelProps {
  alerts: AlertItem[];
  onAcknowledge?: (alertId: string) => void;
}

export const AlertPanel: React.FC<AlertPanelProps> = ({ alerts, onAcknowledge }) => {
  const unacknowledged = alerts.filter((a) => !a.acknowledged);

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur-md p-5 shadow-xl flex flex-col h-full">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
        <div className="flex items-center gap-2">
          <div className="relative">
            <BellRing className="w-5 h-5 text-orange-400" />
            {unacknowledged.length > 0 && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-ping" />
            )}
          </div>
          <h2 className="text-base font-bold text-slate-100">Live Incident & Threat Feed</h2>
        </div>
        <span className="px-2 py-0.5 rounded text-xs font-mono font-semibold bg-red-950/80 text-red-300 border border-red-500/40">
          {unacknowledged.length} Active
        </span>
      </div>

      <div className="space-y-3 overflow-y-auto flex-1 max-h-[380px] pr-1">
        {alerts.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs">
            No active threat alerts registered in this sector.
          </div>
        ) : (
          alerts.map((alert) => {
            const isCritical = alert.severity === "CRITICAL";
            const isHigh = alert.severity === "HIGH";

            return (
              <div
                key={alert._id}
                className={`p-3.5 rounded-lg border transition-all text-xs flex flex-col gap-2 ${
                  alert.acknowledged
                    ? "bg-slate-950/40 border-slate-800/80 opacity-60"
                    : isCritical
                    ? "bg-red-950/40 border-red-500/80 text-red-200 critical-glow"
                    : isHigh
                    ? "bg-orange-950/30 border-orange-500/60 text-orange-200"
                    : "bg-slate-950/60 border-slate-800 text-slate-300"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {isCritical ? (
                      <Flame className="w-4 h-4 text-red-400 fill-red-500 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-orange-400 shrink-0" />
                    )}
                    <span className="font-mono font-bold text-slate-100">{alert.deviceId}</span>
                    <span
                      className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-bold uppercase ${
                        isCritical
                          ? "bg-red-600 text-white"
                          : isHigh
                          ? "bg-orange-600 text-white"
                          : "bg-yellow-600 text-black"
                      }`}
                    >
                      {alert.severity}
                    </span>
                  </div>

                  {!alert.acknowledged && onAcknowledge && (
                    <button
                      onClick={() => onAcknowledge(alert._id)}
                      className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-200 flex items-center gap-1 border border-slate-700 transition-colors"
                      title="Acknowledge Alert"
                    >
                      <Check className="w-3 h-3 text-emerald-400" />
                      Ack
                    </button>
                  )}
                </div>

                <p className="text-slate-200 leading-relaxed">{alert.message}</p>

                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800/60">
                  <span className="font-mono uppercase">{alert.type}</span>
                  <span className="flex items-center gap-1 text-slate-500">
                    <Clock className="w-3 h-3" />
                    {new Date(alert.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
