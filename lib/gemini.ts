import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY || "";

let genAI: GoogleGenerativeAI | null = null;
if (apiKey) {
  genAI = new GoogleGenerativeAI(apiKey);
}

export function getGeminiModel(modelName: string = "gemini-1.5-flash") {
  if (!genAI) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY is not set in environment variables");
    }
    genAI = new GoogleGenerativeAI(key);
  }
  return genAI.getGenerativeModel({ model: modelName });
}

export function isGeminiConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "dummy_or_your_gemini_api_key_here");
}
