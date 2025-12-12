export interface ChunkMetadata {
  path?: string;
  chunkIndex?: number;
  module?: string;
  name?: string;
  type?: string;
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
  id?: string;
  module?: string;
  name?: string;
  path?: string;
  queryText?: string;
  prompt?: string;
  metadataFilter?: boolean;
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

export interface DeleteChunkResponse {
  success: boolean;
  message?: string;
  error?: string;
}

