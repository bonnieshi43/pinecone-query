import express, { Request, Response } from "express";
import {
  queryChunks,
  getChunkById,
  updateChunk,
  deleteChunk,
} from "../services/pineconeService.js";
import type {
  QueryChunksRequest,
  QueryChunksResponse,
  UpdateChunkRequest,
  UpdateChunkResponse,
  DeleteChunkResponse,
} from "../types/chunk.js";

const router = express.Router();

// 查询 chunks
router.post("/query", async (req: Request<{}, QueryChunksResponse, QueryChunksRequest>, res: Response<QueryChunksResponse>) => {
  try {
    const request: QueryChunksRequest = req.body;

    // 验证至少有一个查询条件
    if (!request.id && !request.module && !request.name && !request.path && !request.queryText && !request.prompt) {
      return res.status(400).json({
        success: false,
        chunks: [],
        error: "At least one query parameter (id, module, name, path, queryText, or prompt) is required",
      });
    }

    const chunks = await queryChunks(request);

    res.json({
      success: true,
      chunks: chunks,
      total: chunks.length,
      page: request.page || 1,
      pageSize: request.pageSize || 20,
    });
  } catch (error: any) {
    console.error("Error querying chunks:", error);
    res.status(500).json({
      success: false,
      chunks: [],
      error: error.message || "Failed to query chunks",
    });
  }
});

// 获取单个 chunk
router.get("/:chunkId", async (req: Request<{ chunkId: string }>, res: Response) => {
  try {
    const { chunkId } = req.params;

    const chunk = await getChunkById(chunkId);

    if (!chunk) {
      return res.status(404).json({
        success: false,
        error: `Chunk with id ${chunkId} not found`,
      });
    }

    res.json({
      success: true,
      chunk: chunk,
    });
  } catch (error: any) {
    console.error("Error fetching chunk:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch chunk",
    });
  }
});

// 更新 chunk
router.put("/:chunkId", async (req: Request<{ chunkId: string }, UpdateChunkResponse, UpdateChunkRequest>, res: Response<UpdateChunkResponse>) => {
  try {
    const { chunkId } = req.params;
    const { pageContent, metadata } = req.body;

    // 验证至少有一个更新字段
    if (pageContent === undefined && !metadata) {
      return res.status(400).json({
        success: false,
        error: "At least one field (pageContent or metadata) must be provided for update",
      });
    }

    const updatedChunk = await updateChunk(chunkId, pageContent, metadata);

    res.json({
      success: true,
      chunk: updatedChunk,
    });
  } catch (error: any) {
    console.error("Error updating chunk:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to update chunk",
    });
  }
});

// 删除 chunk
router.delete("/:chunkId", async (req: Request<{ chunkId: string }>, res: Response<DeleteChunkResponse>) => {
  try {
    const { chunkId } = req.params;

    await deleteChunk(chunkId);

    res.json({
      success: true,
      message: `Chunk with id ${chunkId} deleted successfully`,
    });
  } catch (error: any) {
    console.error("Error deleting chunk:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to delete chunk",
    });
  }
});

export default router;

