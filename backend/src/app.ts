/**
 * @file app.ts
 * @description Express application setup, configuring global middleware (CORS, JSON parsing, error handling) and mounting API route endpoints.
 */
import express from "express";
import postRoutes from "./routes/postRoutes.js";
import cardRoutes from "./routes/cardRoutes.js";
import runRoutes from "./routes/runRoutes.js";
import leaderboardRoutes from "./routes/leaderboardRoutes.js";

const app = express();

app.use(express.json());

// Register forum post endpoints
app.use("/api/posts", postRoutes);

// Register game endpoints
app.use("/api/cards", cardRoutes);
app.use("/api/runs", runRoutes);
app.use("/api/leaderboard", leaderboardRoutes);

export default app;