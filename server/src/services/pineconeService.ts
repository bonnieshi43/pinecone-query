import { Pinecone } from "@pinecone-database/pinecone";
import dotenv from "dotenv";
import type { Chunk, ChunkMetadata, QueryChunksRequest } from "../types/chunk.js";
import { generateEmbedding } from "./embeddingService.js";

dotenv.config();

let cachedPinecone: Pinecone | null = null;
let cachedIndex: any = null;

export function getPineconeClient(): Pinecone {
  if (cachedPinecone) {
    return cachedPinecone;
  }

  if (!process.env.PINECONE_API_KEY) {
    throw new Error("PINECONE_API_KEY is not configured");
  }

  cachedPinecone = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY,
  });

  return cachedPinecone;
}

export function getPineconeIndex() {
  if (cachedIndex) {
    return cachedIndex;
  }

  if (!process.env.PINECONE_INDEX) {
    throw new Error("PINECONE_INDEX is not configured");
  }

  const pinecone = getPineconeClient();
  cachedIndex = pinecone.index(process.env.PINECONE_INDEX);

  return cachedIndex;
}

/**
 * 构建 Pinecone metadata 过滤器
 */
function buildMetadataFilter(request: QueryChunksRequest): any {
  const filter: any = {};

  if (request.module) {
    filter.module = { $eq: request.module };
  }

  if (request.name) {
    filter.name = { $eq: request.name };
  }

  if (request.path) {
    // 支持部分匹配，使用 $regex 或 $in
    // Pinecone 的 filter 可能不支持 $regex，所以使用包含匹配
    filter.path = { $eq: request.path };
  }

  return Object.keys(filter).length > 0 ? filter : undefined;
}

/**
 * 查询 chunks
 */
export async function queryChunks(request: QueryChunksRequest): Promise<Chunk[]> {
  const index = getPineconeIndex();
  const filter = buildMetadataFilter(request);
  const topK = request.topK || 100;
  const page = request.page || 1;
  const pageSize = request.pageSize || 20;

  let chunks: Chunk[] = [];

  if (request.queryText) {
    // 使用向量相似度查询
    const queryEmbedding = await generateEmbedding(request.queryText);

    const queryResponse = await index.query({
      vector: queryEmbedding,
      topK: topK,
      includeMetadata: true,
      filter: filter,
    });

    chunks = queryResponse.matches.map((match) => ({
      id: match.id,
      pageContent: (match.metadata as any)?.pageContent || (match.metadata as any)?.text || "",
      metadata: (match.metadata as any) || {},
      score: match.score,
    }));
  } else if (filter) {
    // 只使用 metadata 过滤，Pinecone 需要至少一个向量进行查询
    // 使用一个通用的查询向量来获取所有匹配的向量，然后用 filter 过滤
    const dummyQuery = "document";
    const queryEmbedding = await generateEmbedding(dummyQuery);

    const queryResponse = await index.query({
      vector: queryEmbedding,
      topK: Math.min(topK * 2, 1000), // 查询更多结果以确保覆盖
      includeMetadata: true,
      filter: filter,
    });

    chunks = queryResponse.matches.map((match) => ({
      id: match.id,
      pageContent: (match.metadata as any)?.pageContent || (match.metadata as any)?.text || "",
      metadata: (match.metadata as any) || {},
      score: match.score,
    }));

    // 客户端过滤（支持部分匹配，因为 Pinecone filter 只支持精确匹配）
    if (request.module) {
      chunks = chunks.filter((chunk) => {
        const module = chunk.metadata.module || "";
        return module.toLowerCase().includes(request.module!.toLowerCase());
      });
    }

    if (request.name) {
      chunks = chunks.filter((chunk) => {
        const name = chunk.metadata.name || "";
        return name.toLowerCase().includes(request.name!.toLowerCase());
      });
    }

    if (request.path) {
      chunks = chunks.filter((chunk) => {
        const path = chunk.metadata.path || "";
        return path.toLowerCase().includes(request.path!.toLowerCase());
      });
    }
  } else {
    // 没有查询条件，返回空
    return [];
  }

  // 分页
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  return chunks.slice(startIndex, endIndex);
}

/**
 * 获取单个 chunk
 */
export async function getChunkById(chunkId: string): Promise<Chunk | null> {
  const index = getPineconeIndex();

  try {
    const fetchResponse = await index.fetch([chunkId]);

    if (!fetchResponse.records || Object.keys(fetchResponse.records).length === 0) {
      return null;
    }

    const record = fetchResponse.records[chunkId];
    if (!record) {
      return null;
    }

    return {
      id: record.id,
      pageContent: (record.metadata as any)?.pageContent || (record.metadata as any)?.text || "",
      metadata: (record.metadata as any) || {},
    };
  } catch (error: any) {
    console.error("Error fetching chunk:", error);
    throw new Error(`Failed to fetch chunk: ${error.message}`);
  }
}

/**
 * 更新 chunk
 */
export async function updateChunk(
  chunkId: string,
  pageContent?: string,
  metadata?: Partial<ChunkMetadata>
): Promise<Chunk> {
  const index = getPineconeIndex();

  // 获取当前 chunk
  const currentChunk = await getChunkById(chunkId);
  if (!currentChunk) {
    throw new Error(`Chunk with id ${chunkId} not found`);
  }

  // 合并 metadata
  const updatedMetadata: ChunkMetadata = {
    ...currentChunk.metadata,
    ...metadata,
    lastModified: new Date().toISOString(),
  };

  // 如果内容有更新，需要重新生成 embedding
  let vector: number[] | undefined;
  let finalPageContent = pageContent !== undefined ? pageContent : currentChunk.pageContent;

  if (pageContent !== undefined && pageContent !== currentChunk.pageContent) {
    vector = await generateEmbedding(finalPageContent);
  } else {
    // 如果只更新 metadata，需要获取当前的 vector
    const fetchResponse = await index.fetch([chunkId]);
    const record = fetchResponse.records[chunkId];
    if (record && record.values) {
      vector = record.values;
    } else {
      // 如果无法获取 vector，重新生成
      vector = await generateEmbedding(finalPageContent);
    }
  }

  // 更新 metadata 中的 pageContent（如果 Pinecone 存储了它）
  if (finalPageContent) {
    updatedMetadata.pageContent = finalPageContent;
    updatedMetadata.text = finalPageContent; // 兼容不同的 metadata 字段名
  }

  // 使用 upsert 更新
  await index.upsert([
    {
      id: chunkId,
      values: vector,
      metadata: updatedMetadata as any,
    },
  ]);

  return {
    id: chunkId,
    pageContent: finalPageContent,
    metadata: updatedMetadata,
  };
}

/**
 * 获取索引统计信息
 */
export async function getIndexStats(): Promise<any> {
  const index = getPineconeIndex();
  return await index.describeIndexStats();
}

