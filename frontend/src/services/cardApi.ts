/**
 * @file cardApi.ts
 * @description API service methods for power-up card CRUD operations and draft queries.
 */

import { apiRequest } from "./api.js";
import type { Card, CreateCardData } from "../types/card.js";

export interface CardFilterParams {
    user_id?: number;
}

export async function getAllCards(filter?: CardFilterParams): Promise<Card[]> {
    const params: Record<string, string | number | undefined> = {};
    if (filter?.user_id !== undefined) params.user_id = filter.user_id;

    return await apiRequest<Card[]>("/cards", { params });
}

export async function getDraftPool(count: number = 3): Promise<Card[]> {
    return await apiRequest<Card[]>("/cards/draft", {
        params: { count },
    });
}

export async function getCardById(id: number): Promise<Card> {
    return await apiRequest<Card>(`/cards/${id}`);
}

export async function createCard(data: CreateCardData): Promise<Card> {
    return await apiRequest<Card>("/cards", {
        method: "POST",
        body: JSON.stringify(data),
    });
}

export async function updateCard(id: number, data: Partial<CreateCardData>): Promise<Card> {
    return await apiRequest<Card>(`/cards/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
    });
}

export async function deleteCard(id: number): Promise<{ message: string }> {
    return await apiRequest<{ message: string }>(`/cards/${id}`, {
        method: "DELETE",
    });
}
