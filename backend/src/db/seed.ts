/**
 * @file seed.ts
 * @description Database seeding utility script to populate initial users, characters, and power-up cards for development and testing.
 */

import { db } from "../config/db.js";

export async function seedPresets(): Promise<void> {
    const presets = [
        {
            user_id: null,
            title: "Iron Knight",
            hp: 150,
            attack: 14,
            defense: 18,
            crit_chance: 5,
            armor_piercing: false,
            is_preset: true,
            sprite_url: "/assets/characters/idle/knight.png",
        },
        {
            user_id: null,
            title: "Shadow Rogue",
            hp: 85,
            attack: 18,
            defense: 4,
            crit_chance: 30,
            armor_piercing: true,
            is_preset: true,
            sprite_url: "/assets/characters/idle/rogue.png",
        },
        {
            user_id: null,
            title: "Battle Mage",
            hp: 95,
            attack: 22,
            defense: 6,
            crit_chance: 15,
            armor_piercing: true,
            is_preset: true,
            sprite_url: "/assets/characters/idle/mage.png",
        },
        {
            user_id: null,
            title: "Berserker",
            hp: 120,
            attack: 20,
            defense: 10,
            crit_chance: 10,
            armor_piercing: false,
            is_preset: true,
            sprite_url: "/assets/characters/idle/warrior.png",
        },
    ];

    for (const preset of presets) {
        const existing = await db
            .selectFrom("characters")
            .select("id")
            .where("title", "=", preset.title)
            .where("is_preset", "=", true)
            .executeTakeFirst();

        if (!existing) {
            await db.insertInto("characters").values(preset).execute();
            console.log(`Seeded preset character: ${preset.title}`);
        }
    }
}

async function main() {
    try {
        await seedPresets();
        console.log("Seeding completed successfully.");
    } catch (error) {
        console.error("Seeding failed:", error);
        process.exit(1);
    } finally {
        await db.destroy();
    }
}

// Run directly if invoked via CLI
if (process.argv[1]?.endsWith("seed.ts") || process.argv[1]?.endsWith("seed.js")) {
    main();
}
