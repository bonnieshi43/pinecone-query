export interface ChunkMetadata {
  path?: string;
  chunkIndex?: number;
  module?: string;
  name?: string;
  summary?: string;
  tags?: string[];
  keywords?: string[];
  extra?: Record<string, string>;
  lastModified?: string;
  [key: string]: any;
}

export interface Chunk {
  id: string;
  pageContent: string;
  metadata: ChunkMetadata;
  score?: number;
}

export interface QueryChunksRequest {
  module?: string;
  name?: string;
  path?: string;
  queryText?: string;
  topK?: number;
  page?: number;
  pageSize?: number;
}

export interface QueryChunksResponse {
  success: boolean;
  chunks: Chunk[];
  total?: number;
  page?: number;
  pageSize?: number;
  error?: string;
}

export interface UpdateChunkRequest {
  pageContent?: string;
  metadata?: Partial<ChunkMetadata>;
}

export interface UpdateChunkResponse {
  success: boolean;
  chunk?: Chunk;
  error?: string;
}

