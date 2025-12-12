import type {
  QueryChunksRequest,
  QueryChunksResponse,
  UpdateChunkRequest,
  UpdateChunkResponse,
  ChunkDetailResponse,
  DeleteChunkResponse,
} from "../types/chunk";

const API_BASE = "/api";

export async function queryChunks(request: QueryChunksRequest): Promise<QueryChunksResponse> {
  const response = await fetch(`${API_BASE}/chunks/query`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to query chunks");
  }

  return await response.json();
}

export async function getChunkById(chunkId: string): Promise<ChunkDetailResponse> {
  const response = await fetch(`${API_BASE}/chunks/${chunkId}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to fetch chunk");
  }

  return await response.json();
}

export async function updateChunk(
  chunkId: string,
  request: UpdateChunkRequest
): Promise<UpdateChunkResponse> {
  const response = await fetch(`${API_BASE}/chunks/${chunkId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to update chunk");
  }

  return await response.json();
}

export async function deleteChunk(chunkId: string): Promise<DeleteChunkResponse> {
  const response = await fetch(`${API_BASE}/chunks/${chunkId}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to delete chunk");
  }

  return await response.json();
}

export async function getStats(): Promise<any> {
  const response = await fetch(`${API_BASE}/stats`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to fetch stats");
  }

  return await response.json();
}

