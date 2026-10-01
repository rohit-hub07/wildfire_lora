export type RiskLevel = "LOW" | "MODERATE" | "HIGH" | "VERY_HIGH" | "CRITICAL";

export interface RiskAnalysisResult {
  riskScore: number;
  riskLevel: RiskLevel;
  reasons: string[];
}

export interface SensorInputData {
  temperature: number;
  humidity: number;
  smokeLevel: number;
  gasLevel: number;
  flameDetected: boolean;
  airQuality?: number;
  pressure?: number;
}

/**
 * Prototype wildfire risk scoring algorithm based on environmental thresholds.
 * DISCLAIMER: This is a prototype risk-scoring algorithm and must not be presented
 * as a scientifically validated wildfire prediction model.
 */
export function calculateWildfireRisk(data: SensorInputData): RiskAnalysisResult {
  const reasons: string[] = [];
  let score = 0;

  // Temperature Thresholds:
  // < 30°C → low (0-5)
  // 30-38°C → moderate (10-15)
  // 38-45°C → high (22-25)
  // > 45°C → very high (30-35)
  if (data.temperature > 45) {
    score += 30;
    reasons.push("Very high temperature");
  } else if (data.temperature >= 38) {
    score += 24;
    reasons.push("High temperature");
  } else if (data.temperature >= 30) {
    score += 12;
    reasons.push("Moderate temperature");
  } else {
    score += 2;
  }

  // Humidity Thresholds:
  // > 60% → low (0)
  // 40-60% → moderate (8)
  // 20-40% → high (18)
  // < 20% → very high (28)
  if (data.humidity < 20) {
    score += 28;
    reasons.push("Very low humidity");
  } else if (data.humidity <= 40) {
    score += 18;
    reasons.push("Low humidity");
  } else if (data.humidity <= 60) {
    score += 8;
    reasons.push("Moderate humidity");
  } else {
    score += 0;
  }

  // Smoke Thresholds:
  // < 200 → low (0)
  // 200-500 → moderate (10)
  // 500-800 → high (20)
  // > 800 → very high (28)
  if (data.smokeLevel > 800) {
    score += 28;
    reasons.push("Very high smoke level");
  } else if (data.smokeLevel >= 500) {
    score += 20;
    reasons.push("High smoke level");
  } else if (data.smokeLevel >= 200) {
    score += 10;
    reasons.push("Elevated smoke level");
  } else {
    score += 0;
  }

  // Gas Thresholds:
  // < 300 → low (0)
  // 300-500 → moderate (5)
  // 500-700 → high (10)
  // > 700 → very high (15)
  if (data.gasLevel > 700) {
    score += 15;
    reasons.push("High gas concentration");
  } else if (data.gasLevel >= 500) {
    score += 10;
    reasons.push("Elevated gas concentration");
  } else if (data.gasLevel >= 300) {
    score += 5;
    reasons.push("Moderate gas concentration");
  }

  // Flame detection: Major trigger
  if (data.flameDetected) {
    score += 20;
    reasons.push("Flame detected");
  }

  // Cap score at 100 max, 0 min
  const finalScore = Math.min(100, Math.max(0, Math.round(score)));

  // Categorize Risk Level
  let riskLevel: RiskLevel = "LOW";
  if (data.flameDetected || finalScore >= 90) {
    riskLevel = "CRITICAL";
  } else if (finalScore >= 75) {
    riskLevel = "HIGH";
  } else if (finalScore >= 50) {
    riskLevel = "MODERATE";
  } else if (finalScore >= 25) {
    riskLevel = "LOW";
  } else {
    riskLevel = "LOW";
  }

  // Clean empty reasons if everything was normal
  if (reasons.length === 0) {
    reasons.push("All environmental parameters within nominal ranges");
  }

  return {
    riskScore: finalScore,
    riskLevel,
    reasons,
  };
}
