/**
 * @file cards.test.ts
 * @description Supertest integration tests for card creation, modification, effect range validation, and artwork attachment.
 */

import { db } from "../src/config/db.js";
import { api, asUser, cardBody, createUser, tick } from "./helpers.js";

async function createCard(user: { id: number }, overrides: Record<string, unknown> = {}) {
    const res = await api().post("/api/cards").set(asUser(user)).send(cardBody(overrides));
    expect(res.status).toBe(201);
    return res.body;
}

async function countCards(): Promise<number> {
    const row = await db.selectFrom("cards").select(db.fn.countAll().as("n")).executeTakeFirstOrThrow();
    return Number(row.n);
}

describe("POST /api/cards", () => {
    test("a logged-in user can create a card and it is saved under their account", async () => {
        const alice = await createUser();

        const res = await api().post("/api/cards").set(asUser(alice)).send(cardBody({ title: "Sharp Teeth", effect_type: "damage", value: 5 }));

        expect(res.status).toBe(201);
        expect(res.body).toMatchObject({ title: "Sharp Teeth", effect_type: "damage", value: 5, user_id: alice.id });

        const fetched = await api().get(`/api/cards/${res.body.id}`);
        expect(fetched.status).toBe(200);
        expect(fetched.body.title).toBe("Sharp Teeth");
    });

    test.each(["damage", "shield", "speed", "heal"])("accepts the %s effect type", async (effect) => {
        const alice = await createUser();
        const res = await api().post("/api/cards").set(asUser(alice)).send(cardBody({ effect_type: effect }));
        expect(res.status).toBe(201);
        expect(res.body.effect_type).toBe(effect);
    });

    test("keeps decimal values as numbers", async () => {
        const alice = await createUser();

        const res = await api().post("/api/cards").set(asUser(alice)).send(cardBody({ value: 2.5 }));

        expect(res.status).toBe(201);
        expect(res.body.value).toBe(2.5);
        const fetched = await api().get(`/api/cards/${res.body.id}`);
        expect(fetched.body.value).toBe(2.5);
    });

    test("allows negative values (debuff cards)", async () => {
        const alice = await createUser();
        const res = await api().post("/api/cards").set(asUser(alice)).send(cardBody({ effect_type: "speed", value: -3 }));
        expect(res.status).toBe(201);
        expect(res.body.value).toBe(-3);
    });

    test("the creator is the logged-in user, even if the body claims someone else", async () => {
        const alice = await createUser();
        const bob = await createUser();

        const res = await api().post("/api/cards").set(asUser(alice)).send(cardBody({ user_id: bob.id }));

        expect(res.status).toBe(201);
        expect(res.body.user_id).toBe(alice.id);
    });

    test("trims whitespace from text fields", async () => {
        const alice = await createUser();

        const res = await api().post("/api/cards").set(asUser(alice)).send(cardBody({ title: "  Cheese  ", description: " yum " }));

        expect(res.status).toBe(201);
        expect(res.body.title).toBe("Cheese");
        expect(res.body.description).toBe("yum");
    });

    test("requires login and saves nothing when logged out", async () => {
        const res = await api().post("/api/cards").send(cardBody());

        expect(res.status).toBe(401);
        expect(await countCards()).toBe(0);
    });

    test.each([
        ["missing title", { title: undefined }],
        ["blank title", { title: "  " }],
        ["missing description", { description: undefined }],
        ["missing effect_type", { effect_type: undefined }],
        ["unknown effect_type", { effect_type: "laser" }],
        ["effect_type with wrong case", { effect_type: "HEAL" }],
        ["missing value", { value: undefined }],
        ["value as a string", { value: "10" }],
        ["value too large", { value: 1_000_000 }],
        ["value too small", { value: -1_000_000 }],
        ["missing image_url", { image_url: undefined }],
    ])("rejects %s with 400 and saves nothing", async (_label, overrides) => {
        const alice = await createUser();

        const res = await api().post("/api/cards").set(asUser(alice)).send(cardBody(overrides));

        expect(res.status).toBe(400);
        expect(await countCards()).toBe(0);
    });
});

describe("GET /api/cards", () => {
    test("returns an empty list when there are no cards", async () => {
        const res = await api().get("/api/cards");
        expect(res.status).toBe(200);
        expect(res.body).toEqual([]);
    });

    test("returns every user's cards without requiring login, newest first", async () => {
        const alice = await createUser();
        const bob = await createUser();
        await createCard(alice, { title: "Oldest" });
        await tick();
        await createCard(bob, { title: "Middle" });
        await tick();
        await createCard(alice, { title: "Newest" });

        const res = await api().get("/api/cards");

        expect(res.status).toBe(200);
        expect(res.body.map((c: { title: string }) => c.title)).toEqual(["Newest", "Middle", "Oldest"]);
    });

    test("?user_id= returns only that user's cards", async () => {
        const alice = await createUser();
        const bob = await createUser();
        await createCard(alice, { title: "A1" });
        await createCard(bob, { title: "B1" });
        await createCard(alice, { title: "A2" });

        const res = await api().get(`/api/cards?user_id=${bob.id}`);

        expect(res.status).toBe(200);
        expect(res.body.map((c: { title: string }) => c.title)).toEqual(["B1"]);
    });

    test("?user_id= for a user with no cards returns an empty list", async () => {
        const alice = await createUser();
        const bob = await createUser();
        await createCard(alice);

        const res = await api().get(`/api/cards?user_id=${bob.id}`);

        expect(res.status).toBe(200);
        expect(res.body).toEqual([]);
    });

    test("rejects an invalid user_id filter with 400", async () => {
        const res = await api().get("/api/cards?user_id=abc");
        expect(res.status).toBe(400);
    });
});

describe("GET /api/cards/:id", () => {
    test("returns the requested card", async () => {
        const alice = await createUser();
        const card = await createCard(alice, { title: "Target" });
        await createCard(alice, { title: "Other" });

        const res = await api().get(`/api/cards/${card.id}`);

        expect(res.status).toBe(200);
        expect(res.body).toMatchObject({ id: card.id, title: "Target" });
    });

    test("returns 404 for a card that does not exist", async () => {
        const res = await api().get("/api/cards/999999");
        expect(res.status).toBe(404);
    });

    test.each(["abc", "0", "-1"])("returns 400 for invalid id %s", async (id) => {
        const res = await api().get(`/api/cards/${id}`);
        expect(res.status).toBe(400);
    });
});

describe("GET /api/cards/draft", () => {
    test("offers 3 different cards by default", async () => {
        const alice = await createUser();
        for (let i = 1; i <= 6; i++) await createCard(alice, { title: `Card ${i}` });

        const res = await api().get("/api/cards/draft");

        expect(res.status).toBe(200);
        expect(res.body).toHaveLength(3);
        const ids = res.body.map((c: { id: number }) => c.id);
        expect(new Set(ids).size).toBe(3);
    });

    test("?count= controls how many cards are offered", async () => {
        const alice = await createUser();
        for (let i = 1; i <= 6; i++) await createCard(alice, { title: `Card ${i}` });

        const res = await api().get("/api/cards/draft?count=5");

        expect(res.status).toBe(200);
        expect(res.body).toHaveLength(5);
    });

    test("offered cards are real cards from the database", async () => {
        const alice = await createUser();
        const made = [await createCard(alice), await createCard(alice), await createCard(alice)];

        const res = await api().get("/api/cards/draft");

        const madeIds = made.map((c) => c.id).sort();
        const offeredIds = res.body.map((c: { id: number }) => c.id).sort();
        expect(offeredIds).toEqual(madeIds);
    });

    test("offers every card when fewer exist than requested", async () => {
        const alice = await createUser();
        await createCard(alice);
        await createCard(alice);

        const res = await api().get("/api/cards/draft?count=5");

        expect(res.status).toBe(200);
        expect(res.body).toHaveLength(2);
    });

    test("returns an empty list when there are no cards", async () => {
        const res = await api().get("/api/cards/draft");
        expect(res.status).toBe(200);
        expect(res.body).toEqual([]);
    });

    test("is random: repeated drafts don't always offer the same cards", async () => {
        const alice = await createUser();
        for (let i = 1; i <= 10; i++) await createCard(alice, { title: `Card ${i}` });

        const draws = new Set<string>();
        for (let i = 0; i < 15; i++) {
            const res = await api().get("/api/cards/draft?count=3");
            draws.add(res.body.map((c: { id: number }) => c.id).sort().join(","));
        }

        // 120 possible 3-card hands; 15 identical draws in a row would be essentially impossible
        expect(draws.size).toBeGreaterThan(1);
    });

    test.each(["0", "11", "abc", "-2"])("rejects count=%s with 400", async (count) => {
        const res = await api().get(`/api/cards/draft?count=${count}`);
        expect(res.status).toBe(400);
    });
});

describe("PATCH /api/cards/:id", () => {
    test("the creator can change some fields and the rest stay the same", async () => {
        const alice = await createUser();
        const card = await createCard(alice, { title: "Old", effect_type: "heal", value: 10 });

        const res = await api().patch(`/api/cards/${card.id}`).set(asUser(alice)).send({ value: 25 });

        expect(res.status).toBe(200);
        expect(res.body).toMatchObject({ title: "Old", effect_type: "heal", value: 25 });
        const fetched = await api().get(`/api/cards/${card.id}`);
        expect(fetched.body).toMatchObject({ title: "Old", effect_type: "heal", value: 25 });
    });

    test("another user cannot edit the card, and it stays unchanged", async () => {
        const alice = await createUser();
        const bob = await createUser();
        const card = await createCard(alice, { value: 10 });

        const res = await api().patch(`/api/cards/${card.id}`).set(asUser(bob)).send({ value: 999 });

        expect(res.status).toBe(404);
        const fetched = await api().get(`/api/cards/${card.id}`);
        expect(fetched.body.value).toBe(10);
    });

    test("editing cannot transfer the card to another user", async () => {
        const alice = await createUser();
        const bob = await createUser();
        const card = await createCard(alice);

        await api().patch(`/api/cards/${card.id}`).set(asUser(alice)).send({ title: "Renamed", user_id: bob.id });

        const fetched = await api().get(`/api/cards/${card.id}`);
        expect(fetched.body.user_id).toBe(alice.id);
    });

    test("requires login", async () => {
        const alice = await createUser();
        const card = await createCard(alice, { title: "Original" });

        const res = await api().patch(`/api/cards/${card.id}`).send({ title: "Changed" });

        expect(res.status).toBe(401);
        const fetched = await api().get(`/api/cards/${card.id}`);
        expect(fetched.body.title).toBe("Original");
    });

    test.each([
        ["no fields", {}],
        ["unknown effect_type", { effect_type: "laser" }],
        ["value as a string", { value: "5" }],
        ["value too large", { value: 1_000_000 }],
        ["blank title", { title: "" }],
    ])("rejects %s with 400 and changes nothing", async (_label, body) => {
        const alice = await createUser();
        const card = await createCard(alice, { title: "Original", effect_type: "heal", value: 10 });

        const res = await api().patch(`/api/cards/${card.id}`).set(asUser(alice)).send(body);

        expect(res.status).toBe(400);
        const fetched = await api().get(`/api/cards/${card.id}`);
        expect(fetched.body).toMatchObject({ title: "Original", effect_type: "heal", value: 10 });
    });
});

describe("DELETE /api/cards/:id", () => {
    test("the creator can delete their card and it is gone afterwards", async () => {
        const alice = await createUser();
        const card = await createCard(alice);

        const res = await api().delete(`/api/cards/${card.id}`).set(asUser(alice));

        expect(res.status).toBe(204);
        const fetched = await api().get(`/api/cards/${card.id}`);
        expect(fetched.status).toBe(404);
    });

    test("another user cannot delete the card", async () => {
        const alice = await createUser();
        const bob = await createUser();
        const card = await createCard(alice);

        const res = await api().delete(`/api/cards/${card.id}`).set(asUser(bob));

        expect(res.status).toBe(404);
        const fetched = await api().get(`/api/cards/${card.id}`);
        expect(fetched.status).toBe(200);
    });

    test("requires login", async () => {
        const alice = await createUser();
        const card = await createCard(alice);

        const res = await api().delete(`/api/cards/${card.id}`);

        expect(res.status).toBe(401);
        expect(await countCards()).toBe(1);
    });

    test("a card that was drafted in a run can't be deleted, so run history stays intact", async () => {
        const alice = await createUser();
        const card = await createCard(alice);
        const run = (await api().post("/api/runs").set(asUser(alice)).send({})).body;
        await api().post(`/api/runs/${run.id}/cards`).set(asUser(alice)).send({ card_id: card.id });

        const res = await api().delete(`/api/cards/${card.id}`).set(asUser(alice));

        expect(res.status).toBe(409);
        const fetched = await api().get(`/api/cards/${card.id}`);
        expect(fetched.status).toBe(200);
        const runAfter = await api().get(`/api/runs/${run.id}`);
        expect(runAfter.body.cards.map((c: { id: number }) => c.id)).toEqual([card.id]);
    });

    test("once the run that used it is deleted, the card can be deleted", async () => {
        const alice = await createUser();
        const card = await createCard(alice);
        const run = (await api().post("/api/runs").set(asUser(alice)).send({})).body;
        await api().post(`/api/runs/${run.id}/cards`).set(asUser(alice)).send({ card_id: card.id });
        await api().delete(`/api/runs/${run.id}`).set(asUser(alice));

        const res = await api().delete(`/api/cards/${card.id}`).set(asUser(alice));

        expect(res.status).toBe(204);
    });
});
