/**
 * @file runs.test.ts
 * @description Supertest integration tests verifying game run initiation, stage progression, drafting cards (M:N join table), and score recording.
 */

import { api, asUser, cardBody, createCharacter, createUser, tick } from "./helpers.js";

async function startRun(user: { id: number }, body: Record<string, unknown> = {}) {
    const res = await api().post("/api/runs").set(asUser(user)).send(body);
    expect(res.status).toBe(201);
    return res.body;
}

async function createCard(user: { id: number }, title = "Card") {
    const res = await api().post("/api/cards").set(asUser(user)).send(cardBody({ title }));
    expect(res.status).toBe(201);
    return res.body;
}

async function getRun(runId: number) {
    const res = await api().get(`/api/runs/${runId}`);
    expect(res.status).toBe(200);
    return res.body;
}

describe("POST /api/runs (start a run)", () => {
    test("a new run starts at score 0, stage 0, not completed, owned by the player", async () => {
        const alice = await createUser();

        const res = await api().post("/api/runs").set(asUser(alice)).send({});

        expect(res.status).toBe(201);
        expect(res.body).toMatchObject({ user_id: alice.id, score: 0, level_reached: 0, completed_at: null });
    });

    test("can start a run with a chosen character", async () => {
        const alice = await createUser();
        const rat = await createCharacter(alice);

        const res = await api().post("/api/runs").set(asUser(alice)).send({ character_id: rat.id });

        expect(res.status).toBe(201);
        expect(res.body.character_id).toBe(rat.id);
    });

    test("ignores score/level/user values sent by the client when starting", async () => {
        const alice = await createUser();
        const bob = await createUser();

        const res = await api().post("/api/runs").set(asUser(alice)).send({ score: 5000, level_reached: 50, user_id: bob.id });

        expect(res.status).toBe(201);
        expect(res.body).toMatchObject({ user_id: alice.id, score: 0, level_reached: 0 });
    });

    test("returns 404 for a character that does not exist", async () => {
        const alice = await createUser();
        const res = await api().post("/api/runs").set(asUser(alice)).send({ character_id: 999999 });
        expect(res.status).toBe(404);
    });

    test.each([["abc"], [-1], [1.5]])("returns 400 for invalid character_id %p", async (characterId) => {
        const alice = await createUser();
        const res = await api().post("/api/runs").set(asUser(alice)).send({ character_id: characterId });
        expect(res.status).toBe(400);
    });

    test("requires login", async () => {
        const res = await api().post("/api/runs").send({});
        expect(res.status).toBe(401);
    });
});

describe("GET /api/runs/me", () => {
    test("returns only the logged-in player's runs, newest first", async () => {
        const alice = await createUser();
        const bob = await createUser();
        const first = await startRun(alice);
        await tick();
        await startRun(bob);
        await tick();
        const second = await startRun(alice);

        const res = await api().get("/api/runs/me").set(asUser(alice));

        expect(res.status).toBe(200);
        expect(res.body.map((r: { id: number }) => r.id)).toEqual([second.id, first.id]);
    });

    test("returns an empty list for a player with no runs", async () => {
        const alice = await createUser();
        const res = await api().get("/api/runs/me").set(asUser(alice));
        expect(res.status).toBe(200);
        expect(res.body).toEqual([]);
    });

    test("requires login", async () => {
        const res = await api().get("/api/runs/me");
        expect(res.status).toBe(401);
    });
});

describe("GET /api/runs/:id", () => {
    test("a new run has no drafted cards", async () => {
        const alice = await createUser();
        const run = await startRun(alice);

        const res = await api().get(`/api/runs/${run.id}`);

        expect(res.status).toBe(200);
        expect(res.body).toMatchObject({ id: run.id, user_id: alice.id });
        expect(res.body.cards).toEqual([]);
    });

    test("returns 404 for a run that does not exist", async () => {
        const res = await api().get("/api/runs/999999");
        expect(res.status).toBe(404);
    });

    test("returns 400 for an invalid id", async () => {
        const res = await api().get("/api/runs/abc");
        expect(res.status).toBe(400);
    });
});

describe("POST /api/runs/:id/cards (draft a card)", () => {
    test("drafting a card adds it to the run with quantity 1", async () => {
        const alice = await createUser();
        const run = await startRun(alice);
        const card = await createCard(alice, "Cheese");

        const res = await api().post(`/api/runs/${run.id}/cards`).set(asUser(alice)).send({ card_id: card.id });

        expect(res.status).toBe(201);
        const after = await getRun(run.id);
        expect(after.cards).toHaveLength(1);
        expect(after.cards[0]).toMatchObject({ id: card.id, title: "Cheese", quantity: 1 });
    });

    test("drafting the same card again stacks: quantity goes up instead of a duplicate entry", async () => {
        const alice = await createUser();
        const run = await startRun(alice);
        const card = await createCard(alice);

        for (let i = 0; i < 3; i++) {
            await api().post(`/api/runs/${run.id}/cards`).set(asUser(alice)).send({ card_id: card.id });
        }

        const after = await getRun(run.id);
        expect(after.cards).toHaveLength(1);
        expect(after.cards[0].quantity).toBe(3);
    });

    test("different cards are tracked separately", async () => {
        const alice = await createUser();
        const run = await startRun(alice);
        const cheese = await createCard(alice, "Cheese");
        const fangs = await createCard(alice, "Fangs");

        await api().post(`/api/runs/${run.id}/cards`).set(asUser(alice)).send({ card_id: cheese.id });
        await api().post(`/api/runs/${run.id}/cards`).set(asUser(alice)).send({ card_id: fangs.id });
        await api().post(`/api/runs/${run.id}/cards`).set(asUser(alice)).send({ card_id: fangs.id });

        const after = await getRun(run.id);
        const quantities = Object.fromEntries(after.cards.map((c: { title: string; quantity: number }) => [c.title, c.quantity]));
        expect(quantities).toEqual({ Cheese: 1, Fangs: 2 });
    });

    test("drafts in one run don't show up in another run", async () => {
        const alice = await createUser();
        const runA = await startRun(alice);
        const runB = await startRun(alice);
        const card = await createCard(alice);

        await api().post(`/api/runs/${runA.id}/cards`).set(asUser(alice)).send({ card_id: card.id });

        expect((await getRun(runB.id)).cards).toEqual([]);
    });

    test("players can draft cards that other users created", async () => {
        const alice = await createUser();
        const bob = await createUser();
        const bobsCard = await createCard(bob);
        const run = await startRun(alice);

        const res = await api().post(`/api/runs/${run.id}/cards`).set(asUser(alice)).send({ card_id: bobsCard.id });

        expect(res.status).toBe(201);
    });

    test("cannot draft into another player's run", async () => {
        const alice = await createUser();
        const bob = await createUser();
        const run = await startRun(alice);
        const card = await createCard(bob);

        const res = await api().post(`/api/runs/${run.id}/cards`).set(asUser(bob)).send({ card_id: card.id });

        expect(res.status).toBe(404);
        expect((await getRun(run.id)).cards).toEqual([]);
    });

    test("cannot draft after the run is completed", async () => {
        const alice = await createUser();
        const run = await startRun(alice);
        const card = await createCard(alice);
        await api().post(`/api/runs/${run.id}/complete`).set(asUser(alice)).send({ score: 100, level_reached: 2 });

        const res = await api().post(`/api/runs/${run.id}/cards`).set(asUser(alice)).send({ card_id: card.id });

        expect(res.status).toBe(409);
        expect((await getRun(run.id)).cards).toEqual([]);
    });

    test("returns 404 for a card that does not exist", async () => {
        const alice = await createUser();
        const run = await startRun(alice);

        const res = await api().post(`/api/runs/${run.id}/cards`).set(asUser(alice)).send({ card_id: 999999 });

        expect(res.status).toBe(404);
        expect((await getRun(run.id)).cards).toEqual([]);
    });

    test("returns 404 for a run that does not exist", async () => {
        const alice = await createUser();
        const card = await createCard(alice);
        const res = await api().post("/api/runs/999999/cards").set(asUser(alice)).send({ card_id: card.id });
        expect(res.status).toBe(404);
    });

    test.each([["missing", {}], ["string", { card_id: "1" }], ["zero", { card_id: 0 }]])(
        "returns 400 for %s card_id",
        async (_label, body) => {
            const alice = await createUser();
            const run = await startRun(alice);
            const res = await api().post(`/api/runs/${run.id}/cards`).set(asUser(alice)).send(body);
            expect(res.status).toBe(400);
        }
    );

    test("requires login", async () => {
        const alice = await createUser();
        const run = await startRun(alice);
        const card = await createCard(alice);

        const res = await api().post(`/api/runs/${run.id}/cards`).send({ card_id: card.id });

        expect(res.status).toBe(401);
        expect((await getRun(run.id)).cards).toEqual([]);
    });
});

describe("PATCH /api/runs/:id (update progress mid-run)", () => {
    test("updates score and stage while the run is in progress", async () => {
        const alice = await createUser();
        const run = await startRun(alice);

        const res = await api().patch(`/api/runs/${run.id}`).set(asUser(alice)).send({ score: 150, level_reached: 3 });

        expect(res.status).toBe(200);
        expect(await getRun(run.id)).toMatchObject({ score: 150, level_reached: 3, completed_at: null });
    });

    test("updating only one field leaves the other alone", async () => {
        const alice = await createUser();
        const run = await startRun(alice);
        await api().patch(`/api/runs/${run.id}`).set(asUser(alice)).send({ score: 150, level_reached: 3 });

        await api().patch(`/api/runs/${run.id}`).set(asUser(alice)).send({ level_reached: 4 });

        expect(await getRun(run.id)).toMatchObject({ score: 150, level_reached: 4 });
    });

    test("progress updates do not complete the run", async () => {
        const alice = await createUser();
        const run = await startRun(alice);

        await api().patch(`/api/runs/${run.id}`).set(asUser(alice)).send({ score: 500 });

        expect((await getRun(run.id)).completed_at).toBeNull();
    });

    test.each([
        ["no fields", {}],
        ["negative score", { score: -10 }],
        ["score as a string", { score: "100" }],
        ["fractional stage", { level_reached: 2.5 }],
        ["negative stage", { level_reached: -1 }],
    ])("rejects %s with 400 and changes nothing", async (_label, body) => {
        const alice = await createUser();
        const run = await startRun(alice);

        const res = await api().patch(`/api/runs/${run.id}`).set(asUser(alice)).send(body);

        expect(res.status).toBe(400);
        expect(await getRun(run.id)).toMatchObject({ score: 0, level_reached: 0 });
    });

    test("another player cannot change your run", async () => {
        const alice = await createUser();
        const bob = await createUser();
        const run = await startRun(alice);

        const res = await api().patch(`/api/runs/${run.id}`).set(asUser(bob)).send({ score: 99999 });

        expect(res.status).toBe(404);
        expect((await getRun(run.id)).score).toBe(0);
    });

    test("a completed run's results can't be changed afterwards", async () => {
        const alice = await createUser();
        const run = await startRun(alice);
        await api().post(`/api/runs/${run.id}/complete`).set(asUser(alice)).send({ score: 100, level_reached: 2 });

        const res = await api().patch(`/api/runs/${run.id}`).set(asUser(alice)).send({ score: 99999 });

        expect(res.status).toBeGreaterThanOrEqual(400);
        expect(res.status).toBeLessThan(500);
        expect(await getRun(run.id)).toMatchObject({ score: 100, level_reached: 2 });
    });

    test("requires login", async () => {
        const alice = await createUser();
        const run = await startRun(alice);

        const res = await api().patch(`/api/runs/${run.id}`).send({ score: 10 });

        expect(res.status).toBe(401);
        expect((await getRun(run.id)).score).toBe(0);
    });
});

describe("POST /api/runs/:id/complete (finish a run)", () => {
    test("records the final score and stage and marks the run completed", async () => {
        const alice = await createUser();
        const run = await startRun(alice);

        const res = await api().post(`/api/runs/${run.id}/complete`).set(asUser(alice)).send({ score: 420, level_reached: 6 });

        expect(res.status).toBe(200);
        const after = await getRun(run.id);
        expect(after).toMatchObject({ score: 420, level_reached: 6 });
        expect(after.completed_at).not.toBeNull();
        expect(new Date(after.completed_at).getTime()).toBeGreaterThanOrEqual(new Date(run.created_at).getTime());
    });

    test("a run can only be completed once; the first result stands", async () => {
        const alice = await createUser();
        const run = await startRun(alice);
        await api().post(`/api/runs/${run.id}/complete`).set(asUser(alice)).send({ score: 420, level_reached: 6 });

        const res = await api().post(`/api/runs/${run.id}/complete`).set(asUser(alice)).send({ score: 99999, level_reached: 99 });

        expect(res.status).toBeGreaterThanOrEqual(400);
        expect(res.status).toBeLessThan(500);
        expect(await getRun(run.id)).toMatchObject({ score: 420, level_reached: 6 });
    });

    test("drafted cards are still attached after completing", async () => {
        const alice = await createUser();
        const run = await startRun(alice);
        const card = await createCard(alice);
        await api().post(`/api/runs/${run.id}/cards`).set(asUser(alice)).send({ card_id: card.id });

        await api().post(`/api/runs/${run.id}/complete`).set(asUser(alice)).send({ score: 10, level_reached: 1 });

        expect((await getRun(run.id)).cards.map((c: { id: number }) => c.id)).toEqual([card.id]);
    });

    test.each([
        ["missing score", { level_reached: 3 }],
        ["missing stage", { score: 100 }],
        ["negative score", { score: -1, level_reached: 3 }],
        ["fractional stage", { score: 100, level_reached: 1.5 }],
    ])("rejects %s with 400 and leaves the run in progress", async (_label, body) => {
        const alice = await createUser();
        const run = await startRun(alice);

        const res = await api().post(`/api/runs/${run.id}/complete`).set(asUser(alice)).send(body);

        expect(res.status).toBe(400);
        expect((await getRun(run.id)).completed_at).toBeNull();
    });

    test("another player cannot complete your run", async () => {
        const alice = await createUser();
        const bob = await createUser();
        const run = await startRun(alice);

        const res = await api().post(`/api/runs/${run.id}/complete`).set(asUser(bob)).send({ score: 1, level_reached: 1 });

        expect(res.status).toBe(404);
        expect((await getRun(run.id)).completed_at).toBeNull();
    });

    test("requires login", async () => {
        const alice = await createUser();
        const run = await startRun(alice);

        const res = await api().post(`/api/runs/${run.id}/complete`).send({ score: 1, level_reached: 1 });

        expect(res.status).toBe(401);
        expect((await getRun(run.id)).completed_at).toBeNull();
    });
});

describe("DELETE /api/runs/:id", () => {
    test("the player can delete their run and it is gone afterwards", async () => {
        const alice = await createUser();
        const run = await startRun(alice);

        const res = await api().delete(`/api/runs/${run.id}`).set(asUser(alice));

        expect(res.status).toBe(204);
        expect((await api().get(`/api/runs/${run.id}`)).status).toBe(404);
        expect((await api().get("/api/runs/me").set(asUser(alice))).body).toEqual([]);
    });

    test("deleting a run with drafted cards works and doesn't delete the cards themselves", async () => {
        const alice = await createUser();
        const run = await startRun(alice);
        const card = await createCard(alice);
        await api().post(`/api/runs/${run.id}/cards`).set(asUser(alice)).send({ card_id: card.id });

        const res = await api().delete(`/api/runs/${run.id}`).set(asUser(alice));

        expect(res.status).toBe(204);
        expect((await api().get(`/api/cards/${card.id}`)).status).toBe(200);
    });

    test("another player cannot delete your run", async () => {
        const alice = await createUser();
        const bob = await createUser();
        const run = await startRun(alice);

        const res = await api().delete(`/api/runs/${run.id}`).set(asUser(bob));

        expect(res.status).toBe(404);
        expect((await api().get(`/api/runs/${run.id}`)).status).toBe(200);
    });

    test("requires login", async () => {
        const alice = await createUser();
        const run = await startRun(alice);

        const res = await api().delete(`/api/runs/${run.id}`);

        expect(res.status).toBe(401);
        expect((await api().get(`/api/runs/${run.id}`)).status).toBe(200);
    });
});
