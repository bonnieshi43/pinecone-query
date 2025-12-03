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
 * 规范化文件名，移除 .md 后缀以便匹配
 * 例如: "QuerySquare.md" -> "QuerySquare", "QuerySquare" -> "QuerySquare"
 */
function normalizeName(name: string): string {
  if (!name) return "";
  const normalized = name.trim();
  // 移除 .md 后缀（不区分大小写）
  if (normalized.toLowerCase().endsWith(".md")) {
    return normalized.slice(0, -3);
  }
  return normalized;
}

/**
 * 规范化路径，统一路径分隔符以便匹配
 * 将反斜杠转换为正斜杠，统一路径格式
 * 例如: "modules\\dataworksheet" -> "modules/dataworksheet"
 */
function normalizePath(path: string): string {
  if (!path) return "";
  // 将反斜杠统一转换为正斜杠
  return path.replace(/\\/g, "/").trim();
}

/**
 * 模糊匹配字符串，支持双向包含匹配
 * @param source 源字符串（索引中的数据）
 * @param query 查询字符串（用户输入）
 * @returns 是否匹配
 */
function fuzzyMatch(source: string, query: string): boolean {
  if (!source || !query) return false;
  const normalizedSource = source.toLowerCase().trim();
  const normalizedQuery = query.toLowerCase().trim();
  // 双向包含匹配：源包含查询，或查询包含源
  return normalizedSource.includes(normalizedQuery) || 
         normalizedQuery.includes(normalizedSource);
}

/**
 * 构建 Pinecone metadata 过滤器
 */
function buildMetadataFilter(request: QueryChunksRequest): any {
  if (!request.metadataFilter) {
    return undefined;
  }
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

  // 如果提供了 id，优先使用 id 查询
  if (request.id) {
    const chunk = await getChunkById(request.id);
    if (chunk) {
      return [chunk];
    }
    // 如果 id 不存在，返回空数组
    return [];
  }

  if (request.queryText) {
    // 使用向量相似度查询
    const queryEmbedding = await generateEmbedding(request.queryText);

    const queryResponse = await index.query({
      vector: queryEmbedding,
      topK: topK,
      includeMetadata: true,
      filter: filter,
    });

    chunks = queryResponse.matches.map((match: any) => ({
      id: match.id,
      pageContent: (match.metadata as any)?.pageContent || (match.metadata as any)?.text || "",
      metadata: (match.metadata as any) || {},
      score: match.score,
    }));

    // 当有 queryText 时，也需要在客户端进行模糊过滤（因为 Pinecone filter 是精确匹配）
    if (request.module) {
      chunks = chunks.filter((chunk) => {
        const module = chunk.metadata.module || "";
        return fuzzyMatch(module, request.module!);
      });
    }

    if (request.name) {
      chunks = chunks.filter((chunk) => {
        const chunkName = chunk.metadata.name || "";
        const queryName = request.name || "";
        const normalizedChunkName = normalizeName(chunkName).toLowerCase();
        const normalizedQueryName = normalizeName(queryName).toLowerCase();
        return fuzzyMatch(normalizedChunkName, normalizedQueryName);
      });
    }

    if (request.path) {
      chunks = chunks.filter((chunk) => {
        const chunkPath = chunk.metadata.path || "";
        const queryPath = request.path || "";
        const normalizedChunkPath = normalizePath(chunkPath).toLowerCase();
        const normalizedQueryPath = normalizePath(queryPath).toLowerCase();
        return fuzzyMatch(normalizedChunkPath, normalizedQueryPath);
      });
    }
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

    chunks = queryResponse.matches.map((match: any) => ({
      id: match.id,
      pageContent: (match.metadata as any)?.pageContent || (match.metadata as any)?.text || "",
      metadata: (match.metadata as any) || {},
      score: match.score,
    }));

    // 客户端过滤（支持模糊匹配，因为 Pinecone filter 只支持精确匹配）
    if (request.module) {
      chunks = chunks.filter((chunk) => {
        const module = chunk.metadata.module || "";
        return fuzzyMatch(module, request.module!);
      });
    }

    if (request.name) {
      chunks = chunks.filter((chunk) => {
        const chunkName = chunk.metadata.name || "";
        const queryName = request.name || "";
        // 规范化两边的 name（移除 .md 后缀）后再比较
        const normalizedChunkName = normalizeName(chunkName).toLowerCase();
        const normalizedQueryName = normalizeName(queryName).toLowerCase();
        return fuzzyMatch(normalizedChunkName, normalizedQueryName);
      });
    }

    if (request.path) {
      chunks = chunks.filter((chunk) => {
        const chunkPath = chunk.metadata.path || "";
        const queryPath = request.path || "";
        // 规范化路径（统一分隔符）后再比较
        const normalizedChunkPath = normalizePath(chunkPath).toLowerCase();
        const normalizedQueryPath = normalizePath(queryPath).toLowerCase();
        return fuzzyMatch(normalizedChunkPath, normalizedQueryPath);
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

