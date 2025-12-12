import express, { Request, Response } from "express";
import { processQuery } from "../services/queryService.js";

const router = express.Router();

interface ProcessQueryRequest {
  query: string;
  prompt: string;
}

interface ProcessQueryResponse {
  success: boolean;
  results?: string[];
  error?: string;
}

// 处理 query（简写、重写、分解）
router.post("/process", async (req: Request<{}, ProcessQueryResponse, ProcessQueryRequest>, res: Response<ProcessQueryResponse>) => {
  try {
    const { query, prompt } = req.body;

    if (!query || !prompt) {
      return res.status(400).json({
        success: false,
        error: "Query and prompt are required",
      });
    }

    // 支持多行查询：按行拆分，逐条处理
    const queries = query
      .split("\n")
      .map((q) => q.trim())
      .filter((q) => q.length > 0);

    if (queries.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Query is empty after trimming lines",
      });
    }

    const results = await Promise.all(
      queries.map((q) => processQuery(q, prompt))
    );

    res.json({
      success: true,
      results,
    });
  } catch (error: any) {
    console.error("Error processing query:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to process query",
    });
  }
});

export default router;

