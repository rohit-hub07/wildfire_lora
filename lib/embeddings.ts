import { GoogleGenAI } from "@google/genai";

let genAI: GoogleGenAI | null = null;

export const EMBEDDING_DIMENSIONS = 768;

/**
 * Deterministic pseudo-embedding generator fallback if GEMINI_API_KEY is not configured
 * Produces a 768-dimensional normalized float vector from text.
 * NOTE: Must stay in sync with EMBEDDING_DIMENSIONS and the `outputDimensionality`
 * requested from Gemini, otherwise ChromaDB rejects upserts with:
 * "Collection expecting embedding with dimension of X, got Y".
 */
function generateFallbackEmbedding(text: string, dimensions: number = EMBEDDING_DIMENSIONS): number[] {
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
 * Generate embedding vector for a given text string.
 * Uses `gemini-embedding-001` with outputDimensionality locked to
 * EMBEDDING_DIMENSIONS so live and fallback vectors always match
 * the ChromaDB collection dimension.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "dummy_or_your_gemini_api_key_here" || !apiKey.startsWith("AIza")) {
      return generateFallbackEmbedding(text);
    }

    if (!genAI) {
      genAI = new GoogleGenAI({ apiKey, apiVersion: "v1" });
    }

    const result = await genAI.models.embedContent({
      model: "gemini-embedding-001",
      contents: text,
      config: {
        outputDimensionality: EMBEDDING_DIMENSIONS,
      } as any,
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
