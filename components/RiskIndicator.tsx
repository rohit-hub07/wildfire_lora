"use client";

import React from "react";
import { AlertTriangle, Flame, ShieldAlert, ShieldCheck, Info } from "lucide-react";

interface RiskIndicatorProps {
  score: number;
  level: "LOW" | "MODERATE" | "HIGH" | "VERY_HIGH" | "CRITICAL" | string;
  reasons?: string[];
  size?: "sm" | "md" | "lg";
  showReasons?: boolean;
}

export const RiskIndicator: React.FC<RiskIndicatorProps> = ({
  score,
  level,
  reasons = [],
  size = "md",
  showReasons = false,
}) => {
  const getBadgeStyle = () => {
    switch (level) {
      case "CRITICAL":
        return {
          bg: "bg-red-950/80 border-red-500/80 text-red-300",
          badge: "bg-red-600 text-white",
          dot: "bg-red-500 animate-ping",
          icon: <Flame className="w-4 h-4 text-red-400" />,
        };
      case "VERY_HIGH":
      case "HIGH":
        return {
          bg: "bg-orange-950/80 border-orange-500/80 text-orange-300",
          badge: "bg-orange-600 text-white",
          dot: "bg-orange-500",
          icon: <AlertTriangle className="w-4 h-4 text-orange-400" />,
        };
      case "MODERATE":
        return {
          bg: "bg-yellow-950/80 border-yellow-500/80 text-yellow-300",
          badge: "bg-yellow-600 text-black",
          dot: "bg-yellow-400",
          icon: <ShieldAlert className="w-4 h-4 text-yellow-400" />,
        };
      case "LOW":
      default:
        return {
          bg: "bg-emerald-950/80 border-emerald-500/80 text-emerald-300",
          badge: "bg-emerald-600 text-white",
          dot: "bg-emerald-400",
          icon: <ShieldCheck className="w-4 h-4 text-emerald-400" />,
        };
    }
  };

  const style = getBadgeStyle();

  return (
    <div className="flex flex-col gap-1.5">
      <div
        className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full border text-xs font-semibold backdrop-blur-sm ${style.bg} ${
          level === "CRITICAL" ? "critical-glow" : ""
        }`}
      >
        <span className="relative flex h-2 w-2">
          {level === "CRITICAL" && (
            <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${style.dot}`} />
          )}
          <span className={`relative inline-flex rounded-full h-2 w-2 ${style.dot}`} />
        </span>
        {style.icon}
        <span className="font-bold tracking-wider">{level}</span>
        <span className="opacity-70">|</span>
        <span className="font-mono text-sm">{score}/100</span>
      </div>

      {showReasons && reasons && reasons.length > 0 && (
        <ul className="text-xs space-y-1 text-slate-300 mt-1 pl-1">
          {reasons.map((r, i) => (
            <li key={i} className="flex items-start gap-1.5">
              <span className="text-red-400 mt-0.5">•</span>
              <span>{r}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
