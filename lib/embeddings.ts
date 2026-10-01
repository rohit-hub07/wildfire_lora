import { GoogleGenAI } from "@google/genai";

let genAI: GoogleGenAI | null = null;

/**
 * Deterministic pseudo-embedding generator fallback if GEMINI_API_KEY is not configured
 * Produces a 768-dimensional normalized float vector from text.
 */
function generateFallbackEmbedding(text: string, dimensions: number = 768): number[] {
  const vector = new Array(dimensions).fill(0);
  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i);
    const index = (i * 31 + charCode) % dimensions;
    vector[index] += Math.sin(charCode * (i + 1));
  }
  // Normalize vector
  const norm = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0)) || 1;
  return vector.map((v) => v / norm);
}

/**
 * Generate embedding vector for a given text string using gemini-embedding-004
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "dummy_or_your_gemini_api_key_here") {
      return generateFallbackEmbedding(text);
    }

    if (!genAI) {
      genAI = new GoogleGenAI({ apiKey });
    }

    const result = await genAI.models.embedContent({
      model: "gemini-embedding-004",
      contents: text,
    });

    if (result.embeddings && result.embeddings[0]?.values) {
      return result.embeddings[0].values;
    }
    return generateFallbackEmbedding(text);
  } catch (error) {
    console.warn("Embedding API failed or rate-limited, using fallback vector:", error);
    return generateFallbackEmbedding(text);
  }
}

/**
 * Batch generate embeddings
 */
export async function generateBatchEmbeddings(texts: string[]): Promise<number[][]> {
  const embeddings: number[][] = [];
  for (const text of texts) {
    const emb = await generateEmbedding(text);
    embeddings.push(emb);
  }
  return embeddings;
}
