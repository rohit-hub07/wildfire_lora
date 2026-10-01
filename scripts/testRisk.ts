import { calculateWildfireRisk } from "../lib/riskAnalysis";

function runTests() {
  console.log("=== Testing Wildfire Risk Scoring Algorithm ===");

  // Test Case 1: Baseline nominal conditions
  const normal = calculateWildfireRisk({
    temperature: 24,
    humidity: 65,
    smokeLevel: 120,
    gasLevel: 150,
    flameDetected: false,
  });
  console.log("Nominal Case Result:", normal);
  if (normal.riskLevel !== "LOW") throw new Error("Nominal should be LOW");

  // Test Case 2: High Risk Scenario (NODE-001)
  const highRisk = calculateWildfireRisk({
    temperature: 42.7,
    humidity: 18.4,
    smokeLevel: 735,
    gasLevel: 612,
    flameDetected: false,
  });
  console.log("High Risk (NODE-001) Result:", highRisk);
  if (highRisk.riskLevel !== "HIGH") throw new Error("NODE-001 should be HIGH");

  // Test Case 3: Critical Flame Scenario (NODE-003)
  const critical = calculateWildfireRisk({
    temperature: 49.6,
    humidity: 11.7,
    smokeLevel: 942,
    gasLevel: 781,
    flameDetected: true,
  });
  console.log("Critical (NODE-003) Result:", critical);
  if (critical.riskLevel !== "CRITICAL") throw new Error("NODE-003 should be CRITICAL");
  if (critical.riskScore < 90) throw new Error("NODE-003 score should be >= 90");

  console.log(" All unit risk scoring validation tests passed successfully!");
}

runTests();
