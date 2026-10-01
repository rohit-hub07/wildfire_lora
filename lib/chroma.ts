import { ChromaClient } from "chromadb";
import { generateEmbedding } from "./embeddings";

const CHROMA_URL = process.env.CHROMA_URL || "http://localhost:8000";

let chromaClient: ChromaClient | null = null;

export const SENSOR_COLLECTION_NAME = "wildfire_sensor_readings";
export const KNOWLEDGE_COLLECTION_NAME = "wildfire_knowledge_base";

// In-memory vector store fallback in case a standalone ChromaDB server is not running
interface InMemoryVectorItem {
  id: string;
  document: string;
  embedding: number[];
  metadata: Record<string, any>;
}

const inMemoryStores: Record<string, InMemoryVectorItem[]> = {
  [SENSOR_COLLECTION_NAME]: [],
  [KNOWLEDGE_COLLECTION_NAME]: [],
};

export function getChromaClient(): ChromaClient {
  if (!chromaClient) {
    // Parse CHROMA_URL into host/port/ssl to avoid the deprecated 'path' argument
    const url = new URL(CHROMA_URL);
    chromaClient = new ChromaClient({
      host: url.hostname,
      port: Number(url.port) || (url.protocol === "https:" ? 443 : 8000),
      ssl: url.protocol === "https:",
    });
  }
  return chromaClient;
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  let dotProduct = 0;
  let mA = 0;
  let mB = 0;
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    mA += a[i] * a[i];
    mB += b[i] * b[i];
  }
  mA = Math.sqrt(mA);
  mB = Math.sqrt(mB);
  if (mA === 0 || mB === 0) return 0;
  return dotProduct / (mA * mB);
}

export async function getOrCreateChromaCollection(name: string) {
  try {
    const client = getChromaClient();
    const collection = await client.getOrCreateCollection({
      name,
      metadata: { "description": `Wildfire RAG vector collection: ${name}` },
    });
    return { type: "chroma" as const, collection };
  } catch (error) {
    // Chroma server unreachable, fallback smoothly to in-memory vector store
    return { type: "memory" as const, collectionName: name };
  }
}

export async function addDocumentToVectorStore(
  collectionName: string,
  id: string,
  document: string,
  metadata: Record<string, any>,
  embedding?: number[]
) {
  const vector = embedding || (await generateEmbedding(document));

  try {
    const colObj = await getOrCreateChromaCollection(collectionName);
    if (colObj.type === "chroma" && colObj.collection) {
      await colObj.collection.upsert({
        ids: [id],
        documents: [document],
        metadatas: [metadata],
        embeddings: [vector],
      });
      // Also keep in memory store as cache
      upsertInMemory(collectionName, { id, document, embedding: vector, metadata });
      return;
    }
  } catch (e) {
    console.warn(`ChromaDB unreachable for add (${collectionName}), saving in-memory vector fallback.`);
  }

  upsertInMemory(collectionName, { id, document, embedding: vector, metadata });
}

function upsertInMemory(collectionName: string, item: InMemoryVectorItem) {
  if (!inMemoryStores[collectionName]) {
    inMemoryStores[collectionName] = [];
  }
  const idx = inMemoryStores[collectionName].findIndex((x) => x.id === item.id);
  if (idx >= 0) {
    inMemoryStores[collectionName][idx] = item;
  } else {
    inMemoryStores[collectionName].push(item);
  }
}

export async function queryVectorStore(
  collectionName: string,
  queryText: string,
  topK: number = 5,
  where?: Record<string, any>
): Promise<Array<{ id: string; document: string; metadata: Record<string, any>; score?: number }>> {
  const queryEmb = await generateEmbedding(queryText);

  try {
    const colObj = await getOrCreateChromaCollection(collectionName);
    if (colObj.type === "chroma" && colObj.collection) {
      const results = await colObj.collection.query({
        queryEmbeddings: [queryEmb],
        nResults: topK,
        where: where as any,
      });

      if (results && results.ids && results.ids[0] && results.ids[0].length > 0) {
        return results.ids[0].map((id, index) => ({
          id: id as string,
          document: (results.documents?.[0]?.[index] as string) || "",
          metadata: (results.metadatas?.[0]?.[index] as Record<string, any>) || {},
          score: results.distances?.[0]?.[index] ? 1 - results.distances[0][index] : undefined,
        }));
      }
    }
  } catch (e) {
    console.warn(`ChromaDB unreachable for query (${collectionName}), falling back to memory vector search.`);
  }

  // In memory cosine similarity fallback
  const store = inMemoryStores[collectionName] || [];
  if (store.length === 0) return [];

  const scored = store.map((item) => ({
    ...item,
    similarity: cosineSimilarity(queryEmb, item.embedding),
  }));

  scored.sort((a, b) => b.similarity - a.similarity);

  return scored.slice(0, topK).map((item) => ({
    id: item.id,
    document: item.document,
    metadata: item.metadata,
    score: item.similarity,
  }));
}
