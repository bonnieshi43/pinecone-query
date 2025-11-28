import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import chunksRouter from "./routes/chunks.js";
import statsRouter from "./routes/stats.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 3102;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/chunks", chunksRouter);
app.use("/api/stats", statsRouter);

// Health check endpoint
app.get("/api/health", (req: Request, res: Response) => {
  const pineconeStatus = process.env.PINECONE_API_KEY ? "Configured" : "Not configured";
  const voyageStatus = process.env.VOYAGE_API_KEY ? "Configured" : "Not configured";
  const indexStatus = process.env.PINECONE_INDEX ? "Configured" : "Not configured";

  res.json({
    status: "OK",
    service: "Pinecone Update API",
    timestamp: new Date().toISOString(),
    config: {
      pinecone: pineconeStatus,
      voyage: voyageStatus,
      index: indexStatus,
    },
  });
});

// Error handling middleware
app.use((err: any, req: Request, res: Response, next: any) => {
  console.error("Unhandled error:", err);
  res.status(500).json({
    success: false,
    error: err.message || "Internal server error",
  });
});

app.listen(port, () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
  console.log(`🔍 Health check: http://localhost:${port}/api/health`);
  console.log(`📊 Stats: http://localhost:${port}/api/stats`);
  console.log(`🔧 Using Pinecone index: ${process.env.PINECONE_INDEX || "Not configured"}`);
});

