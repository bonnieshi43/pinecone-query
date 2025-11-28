import { VoyageEmbeddings } from "@langchain/community/embeddings/voyage";
import dotenv from "dotenv";

dotenv.config();

let cachedEmbeddings: VoyageEmbeddings | null = null;

export function getEmbeddings(): VoyageEmbeddings {
  if (cachedEmbeddings) {
    return cachedEmbeddings;
  }

  if (!process.env.VOYAGE_API_KEY) {
    throw new Error("VOYAGE_API_KEY is not configured");
  }

  const model = process.env.VOYAGE_EMBEDDING_MODEL || "voyage-3";

  cachedEmbeddings = new VoyageEmbeddings({
    apiKey: process.env.VOYAGE_API_KEY,
    modelName: model,
    inputType: "document",
    truncation: true,
  });

  return cachedEmbeddings;
}

export async function generateEmbedding(text: string): Promise<number[]> {
  const embeddings = getEmbeddings();
  return await embeddings.embedQuery(text);
}

export async function generateDocumentEmbeddings(texts: string[]): Promise<number[][]> {
  const embeddings = getEmbeddings();
  return await embeddings.embedDocuments(texts);
}

