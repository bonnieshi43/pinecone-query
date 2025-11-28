import express, { Request, Response } from "express";
import { getIndexStats } from "../services/pineconeService.js";

const router = express.Router();

// 获取索引统计信息
router.get("/", async (req: Request, res: Response) => {
  try {
    const stats = await getIndexStats();

    res.json({
      success: true,
      stats: stats,
    });
  } catch (error: any) {
    console.error("Error fetching stats:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch stats",
    });
  }
});

export default router;

