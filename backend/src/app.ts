/**
 * @file app.ts
 * @description Express application setup, configuring global middleware (CORS, JSON parsing, error handling) and mounting API route endpoints.
 */
import express from "express";
import postRoutes from "./routes/postRoutes.js";

const app = express();

app.use(express.json());

// Register forum post endpoints
app.use("/api/posts", postRoutes);

export default app;