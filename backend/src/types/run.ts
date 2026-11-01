/**
 * @file run.ts
 * @description TypeScript interface definitions for game Runs, scores, levels cleared, and the Run-Card many-to-many drafted cards association.
 */

import type { Card } from "./card.js";

export interface Run {
    id: number;
    user_id: number;
    character_id: number | null;
    score: number;
    level_reached: number;
    created_at: Date;
    completed_at: Date | null; // null while the run is still in progress
}

// A card drafted during a run (row from run_cards joined with cards)
export interface DraftedCard extends Card {
    quantity: number;
}

export interface RunWithCards extends Run {
    cards: DraftedCard[];
}
