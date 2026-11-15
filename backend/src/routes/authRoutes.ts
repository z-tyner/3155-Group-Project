/**
 * @file authRoutes.ts
 * @description Route definitions for `/api/auth` endpoints including `/signup`, `/login`, and `/me`.
 */

import { Router } from "express";
import { signup, login, getMe } from "../controllers/authController.js";
import { authenticateToken } from "../middleware/auth.js";

const router = Router();

// User registration
router.post("/signup", signup);

// User login
router.post("/login", login);

// Current user profile
router.get("/me", authenticateToken, getMe);

export default router;
