/**
 * @file runApi.ts
 * @description API service methods for creating game runs, querying active runs, and drafting cards.
 */

import { apiRequest } from "./api.js";
import type { Run, RunWithCards } from "../types/game.js";

export async function getMyRuns(): Promise<Run[]> {
    return await apiRequest<Run[]>("/runs/me");
}

export async function getRunById(id: number): Promise<RunWithCards> {
    return await apiRequest<RunWithCards>(`/runs/${id}`);
}

export async function createRun(characterId: number | null): Promise<Run> {
    return await apiRequest<Run>("/runs", {
        method: "POST",
        body: JSON.stringify({ character_id: characterId }),
    });
}

export async function draftCard(runId: number, cardId: number): Promise<any> {
    return await apiRequest(`/runs/${runId}/cards`, {
        method: "POST",
        body: JSON.stringify({ card_id: cardId }),
    });
}

export async function updateRunProgress(
    runId: number,
    progress: { score?: number; level_reached?: number }
): Promise<Run> {
    return await apiRequest<Run>(`/runs/${runId}`, {
        method: "PATCH",
        body: JSON.stringify(progress),
    });
}

export async function completeRun(
    runId: number,
    finalData: { score: number; level_reached: number }
): Promise<Run> {
    return await apiRequest<Run>(`/runs/${runId}/complete`, {
        method: "POST",
        body: JSON.stringify(finalData),
    });
}

export async function deleteRun(runId: number): Promise<{ message: string }> {
    return await apiRequest<{ message: string }>(`/runs/${runId}`, {
        method: "DELETE",
    });
}
