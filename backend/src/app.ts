/**
 * @file app.ts
 * @description Express application setup, configuring global middleware (CORS, JSON parsing, error handling) and mounting API route endpoints.
 */

import express from "express";

// Import API routes
import authRoutes from "./routes/authRoutes.js";
import postRoutes from "./routes/postRoutes.js";
import commentRoutes from "./routes/commentRoutes.js";
import cardRoutes from "./routes/cardRoutes.js";
import characterRoutes from "./routes/characterRoutes.js";
import runRoutes from "./routes/runRoutes.js";
import leaderboardRoutes from "./routes/leaderboardRoutes.js";

import { errorHandler } from "./middleware/errorHandler.js";

const app = express();

// Global middleware
app.use(express.json());
// Register auth endpoints
app.use("/api/auth", authRoutes);

// Register forum endpoints
app.use("/api/posts", postRoutes);
app.use("/api", commentRoutes);

// Register game endpoints
app.use("/api/characters", characterRoutes);
app.use("/api/cards", cardRoutes);
app.use("/api/runs", runRoutes);
app.use("/api/leaderboard", leaderboardRoutes);

// Centralized error handling (must be registered after all routes)
app.use(errorHandler);

export default app;