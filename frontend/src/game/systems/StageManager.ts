/**
 * @file StageManager.ts
 * @description System controlling stage progression, enemy wave spawning, difficulty scaling per level, awarding level-completion combat actions, and triggering card drafts upon level clear.
 */

import { CombatAction, getActionsUnlockedAtLevel } from "../../types/action.js";
import { PlayerBattleState } from "../../types/game.js";

export interface LevelCompletionResult {
    completedLevel: number;
    unlockedActions: CombatAction[];
    triggerCardDraft: boolean;
    isBossLevel: boolean;
    draftOptionCount: number; // 3 standard, +3 bonus if boss defeated per context.txt
}

/**
 * Evaluates completion of a level, unlocking any level-specific attacks
 * configured for that level, and preparing the card draft presentation.
 *
 * @param completedLevel - The level number just beaten
 * @param player - Active player state to receive newly unlocked actions
 * @param isBoss - Whether the level completed was a boss encounter
 */
export function handleLevelCompletion(
    completedLevel: number,
    player: PlayerBattleState,
    isBoss: boolean = false
): LevelCompletionResult {
    // 1. Check for any attacks/actions configured to unlock at this level completion
    const unlockedActions = getActionsUnlockedAtLevel(completedLevel);

    for (const action of unlockedActions) {
        const alreadyAcquired = player.acquiredActions.some((act) => act.id === action.id);
        if (!alreadyAcquired) {
            player.acquiredActions.push(action);
        }
    }

    // 2. Determine card drafting options (context.txt: 3 cards standard, +3 bonus when boss defeated)
    const draftOptionCount = isBoss ? 6 : 3;

    return {
        completedLevel,
        unlockedActions,
        triggerCardDraft: true,
        isBossLevel: isBoss,
        draftOptionCount
    };
}
