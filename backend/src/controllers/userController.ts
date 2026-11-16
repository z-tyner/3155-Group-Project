/**
 * @file userController.ts
 * @description Controller managing user profile operations, profile updates, account deletion, and retrieving user-created cards and characters.
 */

import type { Request, Response } from "express";
import * as userService from "../services/userService.js";
import * as cardService from "../services/cardService.js";
import * as characterService from "../services/characterService.js";

/**
 * Retrieves a user's public profile.
 */
export async function getUserById(
    req: Request,
    res: Response
): Promise<void> {
    try {
        const id = Number(req.params.id);

        if (!Number.isSafeInteger(id) || id <= 0) {
            res.status(400).json({
                message: "Invalid user ID."
            });
            return;
        }

        const user = await userService.getUserById(id);

        if (!user) {
            res.status(404).json({
                message: "User not found."
            });
            return;
        }

        res.status(200).json({ user });
    } catch (error) {
        console.error("Error retrieving user:", error);

        res.status(500).json({
            message: "Failed to retrieve user."
        });
    }
}

/**
 * Retrieves cards created by a specific user.
 */
export async function getUserCards(
    req: Request,
    res: Response
): Promise<void> {
    try {
        const userId = Number(req.params.id);

        if (!Number.isSafeInteger(userId) || userId <= 0) {
            res.status(400).json({
                message: "Invalid user ID."
            });
            return;
        }

        const user = await userService.getUserById(userId);

        if (!user) {
            res.status(404).json({
                message: "User not found."
            });
            return;
        }

        const cards = await cardService.getAllCards(userId);

        res.status(200).json({ cards });
    } catch (error) {
        console.error("Error retrieving user cards:", error);

        res.status(500).json({
            message: "Failed to retrieve user cards."
        });
    }
}

/**
 * Retrieves characters created by a specific user.
 */
export async function getUserCharacters(
    req: Request,
    res: Response
): Promise<void> {
    try {
        const userId = Number(req.params.id);

        if (!Number.isSafeInteger(userId) || userId <= 0) {
            res.status(400).json({
                message: "Invalid user ID."
            });
            return;
        }

        const user = await userService.getUserById(userId);

        if (!user) {
            res.status(404).json({
                message: "User not found."
            });
            return;
        }

        const characters = await characterService.getAllCharacters({
            userId
        });

        res.status(200).json({ characters });
    } catch (error) {
        console.error("Error retrieving user characters:", error);

        res.status(500).json({
            message: "Failed to retrieve user characters."
        });
    }
}

/**
 * Deletes the authenticated user's account and associated content.
 */
export async function deleteCurrentUser(
    req: Request,
    res: Response
): Promise<void> {
    try {
        const userId = req.user?.id;

        if (!userId) {
            res.status(401).json({
                message: "Authentication required."
            });
            return;
        }

        const deleted = await userService.deleteUser(userId);

        if (!deleted) {
            res.status(404).json({
                message: "User not found."
            });
            return;
        }

        res.status(200).json({
            message: "Account and associated content deleted successfully."
        });
    } catch (error) {
        console.error("Error deleting account:", error);

        res.status(500).json({
            message: "Failed to delete account."
        });
    }
}