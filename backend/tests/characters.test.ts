/**
 * @file characters.test.ts
 * @description Supertest integration tests for character CRUD endpoints, stat validation, author association, and preset vs custom character rules.
 */

import { db } from "../src/config/db.js";
import { api, asUser, characterBody, createUser, tick } from "./helpers.js";

async function createCharacterViaApi(user: { id: number }, overrides: Record<string, unknown> = {}) {
    const res = await api().post("/api/characters").set(asUser(user)).send(characterBody(overrides));
    expect(res.status).toBe(201);
    return res.body;
}

async function countCharacters(): Promise<number> {
    const row = await db.selectFrom("characters").select(db.fn.countAll().as("n")).executeTakeFirstOrThrow();
    return Number(row.n);
}

describe("characters", () => {
    describe("POST /api/characters", () => {
        test("a logged-in user can create a character", async () => {
            const alice = await createUser();

            const res = await api()
                .post("/api/characters")
                .set(asUser(alice))
                .send(
                    characterBody({
                        title: "Shadow Blade",
                        hp: 120,
                        attack: 25,
                        defense: 8,
                        crit_chance: 35,
                        armor_piercing: true,
                        sprite_url: "blade.png",
                    })
                );

            expect(res.status).toBe(201);
            expect(res.body).toMatchObject({
                title: "Shadow Blade",
                hp: 120,
                attack: 25,
                defense: 8,
                crit_chance: 35,
                armor_piercing: true,
                sprite_url: "blade.png",
                user_id: alice.id,
                is_preset: false,
            });

            // Verify persistence via GET
            const fetched = await api().get(`/api/characters/${res.body.id}`);
            expect(fetched.status).toBe(200);
            expect(fetched.body.title).toBe("Shadow Blade");
        });

        test("accepts stat aliases (health, attack_power, defence, critical_hit_percentage)", async () => {
            const alice = await createUser();

            const res = await api()
                .post("/api/characters")
                .set(asUser(alice))
                .send({
                    title: "Alias Hero",
                    health: 110,
                    attack_power: 18,
                    defence: 12,
                    critical_hit_percentage: 15,
                    armor_piercing: false,
                    sprite_url: "hero.png",
                });

            expect(res.status).toBe(201);
            expect(res.body).toMatchObject({
                title: "Alias Hero",
                hp: 110,
                attack: 18,
                defense: 12,
                crit_chance: 15,
                armor_piercing: false,
            });
        });

        test("the creator is the logged-in user, even if the body claims someone else or is_preset", async () => {
            const alice = await createUser();
            const bob = await createUser();

            const res = await api()
                .post("/api/characters")
                .set(asUser(alice))
                .send(characterBody({ user_id: bob.id, is_preset: true }));

            expect(res.status).toBe(201);
            expect(res.body.user_id).toBe(alice.id);
            expect(res.body.is_preset).toBe(false);
        });

        test("trims whitespace from string fields", async () => {
            const alice = await createUser();

            const res = await api()
                .post("/api/characters")
                .set(asUser(alice))
                .send(characterBody({ title: "  Space Knight  ", sprite_url: "  knight.png  " }));

            expect(res.status).toBe(201);
            expect(res.body.title).toBe("Space Knight");
            expect(res.body.sprite_url).toBe("knight.png");
        });

        test("requires login and saves nothing when logged out", async () => {
            const res = await api().post("/api/characters").send(characterBody());

            expect(res.status).toBe(401);
            expect(await countCharacters()).toBe(0);
        });

        test.each([
            ["missing title", { title: undefined }],
            ["blank title", { title: "   " }],
            ["missing hp", { hp: undefined, health: undefined }],
            ["negative hp", { hp: -50 }],
            ["zero hp", { hp: 0 }],
            ["hp as a string", { hp: "100" }],
            ["missing attack", { attack: undefined, attack_power: undefined }],
            ["attack as a string", { attack: "twenty" }],
            ["missing defense", { defense: undefined, defence: undefined }],
            ["defense as a string", { defense: "high" }],
            ["missing crit_chance", { crit_chance: undefined, critical_hit_percentage: undefined }],
            ["crit_chance as a string", { crit_chance: "25%" }],
            ["missing armor_piercing", { armor_piercing: undefined }],
            ["armor_piercing as a string", { armor_piercing: "true" }],
            ["armor_piercing as a number", { armor_piercing: 1 }],
            ["missing sprite_url", { sprite_url: undefined }],
            ["blank sprite_url", { sprite_url: "   " }],
        ])("invalid stats are rejected: %s returns 400", async (_label, overrides) => {
            const alice = await createUser();
            const res = await api().post("/api/characters").set(asUser(alice)).send(characterBody(overrides));

            expect(res.status).toBe(400);
            expect(await countCharacters()).toBe(0);
        });
    });

    describe("PATCH /api/characters/:id", () => {
        test("only the creator can edit a character", async () => {
            const alice = await createUser();
            const bob = await createUser();

            const char = await createCharacterViaApi(alice, { title: "Original Alice" });

            // Bob attempts to edit Alice's character
            const bobRes = await api()
                .patch(`/api/characters/${char.id}`)
                .set(asUser(bob))
                .send({ title: "Hacked by Bob" });
            expect(bobRes.status).toBe(404);

            // Alice edits her own character
            const aliceRes = await api()
                .patch(`/api/characters/${char.id}`)
                .set(asUser(alice))
                .send({ title: "Updated by Alice", attack: 30, defense: 15, armor_piercing: false });
            expect(aliceRes.status).toBe(200);
            expect(aliceRes.body.title).toBe("Updated by Alice");
            expect(aliceRes.body.attack).toBe(30);
            expect(aliceRes.body.defense).toBe(15);
            expect(aliceRes.body.armor_piercing).toBe(false);
        });

        test("preset characters cannot be edited", async () => {
            const alice = await createUser();

            // Insert a preset character directly
            const preset = await db
                .insertInto("characters")
                .values({
                    user_id: null,
                    title: "Preset Paladin",
                    hp: 200,
                    attack: 15,
                    defense: 20,
                    crit_chance: 5,
                    armor_piercing: false,
                    is_preset: true,
                    sprite_url: "paladin.png",
                })
                .returningAll()
                .executeTakeFirstOrThrow();

            const res = await api()
                .patch(`/api/characters/${preset.id}`)
                .set(asUser(alice))
                .send({ title: "Modded Paladin" });

            expect(res.status).toBe(403);
        });

        test("rejects update with no fields provided", async () => {
            const alice = await createUser();
            const char = await createCharacterViaApi(alice);

            const res = await api().patch(`/api/characters/${char.id}`).set(asUser(alice)).send({});
            expect(res.status).toBe(400);
        });

        test("requires login for updating", async () => {
            const alice = await createUser();
            const char = await createCharacterViaApi(alice);

            const res = await api().patch(`/api/characters/${char.id}`).send({ title: "Anon Edit" });
            expect(res.status).toBe(401);
        });
    });

    describe("DELETE /api/characters/:id", () => {
        test("only the creator can delete a character", async () => {
            const alice = await createUser();
            const bob = await createUser();

            const char = await createCharacterViaApi(alice, { title: "Alice's Hero" });

            // Bob cannot delete Alice's character
            const bobRes = await api().delete(`/api/characters/${char.id}`).set(asUser(bob));
            expect(bobRes.status).toBe(404);
            expect(await countCharacters()).toBe(1);

            // Alice deletes her own character
            const aliceRes = await api().delete(`/api/characters/${char.id}`).set(asUser(alice));
            expect(aliceRes.status).toBe(204);
            expect(await countCharacters()).toBe(0);
        });

        test("preset characters cannot be deleted", async () => {
            const alice = await createUser();

            const preset = await db
                .insertInto("characters")
                .values({
                    user_id: null,
                    title: "Preset Paladin",
                    hp: 200,
                    attack: 15,
                    defense: 20,
                    crit_chance: 5,
                    armor_piercing: false,
                    is_preset: true,
                    sprite_url: "paladin.png",
                })
                .returningAll()
                .executeTakeFirstOrThrow();

            const res = await api().delete(`/api/characters/${preset.id}`).set(asUser(alice));
            expect(res.status).toBe(403);
            expect(await countCharacters()).toBe(1);
        });

        test("cannot delete a character that has been used in a game run", async () => {
            const alice = await createUser();
            const char = await createCharacterViaApi(alice);

            // Alice starts a run with this character
            await api().post("/api/runs").set(asUser(alice)).send({ character_id: char.id });

            // Alice attempts to delete the character
            const res = await api().delete(`/api/characters/${char.id}`).set(asUser(alice));
            expect(res.status).toBe(409);
            expect(await countCharacters()).toBe(1);
        });
    });

    describe("GET /api/characters and GET /api/characters/:id", () => {
        test("characters can be listed and viewed without logging in", async () => {
            const alice = await createUser();
            const char = await createCharacterViaApi(alice, { title: "Public Warrior" });

            // List characters without auth header
            const listRes = await api().get("/api/characters");
            expect(listRes.status).toBe(200);
            expect(Array.isArray(listRes.body)).toBe(true);
            expect(listRes.body.length).toBe(1);
            expect(listRes.body[0].title).toBe("Public Warrior");

            // View single character without auth header
            const singleRes = await api().get(`/api/characters/${char.id}`);
            expect(singleRes.status).toBe(200);
            expect(singleRes.body.title).toBe("Public Warrior");
        });

        test("can filter characters by preset (?preset=true)", async () => {
            const alice = await createUser();
            await createCharacterViaApi(alice, { title: "Custom One" });

            await db
                .insertInto("characters")
                .values({
                    user_id: null,
                    title: "Preset Archmage",
                    hp: 90,
                    attack: 25,
                    defense: 5,
                    crit_chance: 15,
                    armor_piercing: true,
                    is_preset: true,
                    sprite_url: "mage.png",
                })
                .execute();

            const allRes = await api().get("/api/characters");
            expect(allRes.body.length).toBe(2);

            const presetRes = await api().get("/api/characters?preset=true");
            expect(presetRes.status).toBe(200);
            expect(presetRes.body.length).toBe(1);
            expect(presetRes.body[0].title).toBe("Preset Archmage");
        });

        test("can filter characters by user_id", async () => {
            const alice = await createUser();
            const bob = await createUser();

            await createCharacterViaApi(alice, { title: "Alice Char" });
            await createCharacterViaApi(bob, { title: "Bob Char" });

            const aliceOnly = await api().get(`/api/characters?user_id=${alice.id}`);
            expect(aliceOnly.status).toBe(200);
            expect(aliceOnly.body.length).toBe(1);
            expect(aliceOnly.body[0].title).toBe("Alice Char");
        });

        test("returns 404 for a non-existent character ID", async () => {
            const res = await api().get("/api/characters/999999");
            expect(res.status).toBe(404);
        });

        test("returns 400 for an invalid ID format", async () => {
            const res = await api().get("/api/characters/abc");
            expect(res.status).toBe(400);
        });
    });
});
