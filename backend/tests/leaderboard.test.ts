/**
 * @file leaderboard.test.ts
 * @description Integration tests for the leaderboard (/api/leaderboard): top scores, deepest stage reached,
 * and per-player stats. Only finished runs should ever count.
 */

import { api, asUser, createCharacter, createUser, tick } from "./helpers.js";

// Play a full run through the API: start it, then complete it with the given results
async function finishedRun(user: { id: number }, score: number, level: number, characterId?: number) {
    const start = await api().post("/api/runs").set(asUser(user)).send(characterId ? { character_id: characterId } : {});
    expect(start.status).toBe(201);
    const done = await api().post(`/api/runs/${start.body.id}/complete`).set(asUser(user)).send({ score, level_reached: level });
    expect(done.status).toBe(200);
    return done.body;
}

// Start a run and leave it unfinished (with progress recorded)
async function unfinishedRun(user: { id: number }, score: number, level: number) {
    const start = await api().post("/api/runs").set(asUser(user)).send({});
    expect(start.status).toBe(201);
    await api().patch(`/api/runs/${start.body.id}`).set(asUser(user)).send({ score, level_reached: level });
    return start.body;
}

describe("GET /api/leaderboard (top scores)", () => {
    test("is empty when nobody has finished a run", async () => {
        const res = await api().get("/api/leaderboard");
        expect(res.status).toBe(200);
        expect(res.body).toEqual([]);
    });

    test("works without logging in", async () => {
        const alice = await createUser();
        await finishedRun(alice, 100, 2);

        const res = await api().get("/api/leaderboard");

        expect(res.status).toBe(200);
        expect(res.body).toHaveLength(1);
    });

    test("ranks finished runs from highest to lowest score", async () => {
        const alice = await createUser("alice");
        const bob = await createUser("bob");
        await finishedRun(alice, 200, 3);
        await finishedRun(bob, 900, 5);
        await finishedRun(alice, 500, 4);

        const res = await api().get("/api/leaderboard");

        expect(res.body.map((r: { score: number }) => r.score)).toEqual([900, 500, 200]);
    });

    test("each entry shows who played it, their score, stage, and character", async () => {
        const alice = await createUser("alice");
        const rat = await createCharacter(alice, "Rat King");
        await finishedRun(alice, 300, 4, rat.id);

        const res = await api().get("/api/leaderboard");

        expect(res.body[0]).toMatchObject({ username: "alice", score: 300, level_reached: 4, character_title: "Rat King" });
    });

    test("runs played without a character still appear", async () => {
        const alice = await createUser("alice");
        await finishedRun(alice, 300, 4);

        const res = await api().get("/api/leaderboard");

        expect(res.body).toHaveLength(1);
        expect(res.body[0].character_title).toBeNull();
    });

    test("unfinished runs never appear, even with a high score", async () => {
        const alice = await createUser();
        const bob = await createUser();
        await finishedRun(alice, 100, 2);
        await unfinishedRun(bob, 99999, 50);

        const res = await api().get("/api/leaderboard");

        expect(res.body.map((r: { score: number }) => r.score)).toEqual([100]);
    });

    test("a player can hold more than one spot", async () => {
        const alice = await createUser("alice");
        const bob = await createUser("bob");
        await finishedRun(alice, 900, 5);
        await finishedRun(alice, 800, 5);
        await finishedRun(bob, 100, 1);

        const res = await api().get("/api/leaderboard");

        expect(res.body.map((r: { username: string }) => r.username)).toEqual(["alice", "alice", "bob"]);
    });

    test("on a tied score, whoever finished first ranks higher", async () => {
        const alice = await createUser("alice");
        const bob = await createUser("bob");
        await finishedRun(bob, 500, 3);
        await tick();
        await finishedRun(alice, 500, 3);

        const res = await api().get("/api/leaderboard");

        expect(res.body.map((r: { username: string }) => r.username)).toEqual(["bob", "alice"]);
    });

    test("shows the top 10 by default", async () => {
        const alice = await createUser();
        for (let i = 1; i <= 12; i++) await finishedRun(alice, i * 10, 1);

        const res = await api().get("/api/leaderboard");

        expect(res.body).toHaveLength(10);
        // The 10 highest: 120 down to 30
        expect(res.body[0].score).toBe(120);
        expect(res.body[9].score).toBe(30);
    });

    test("?limit= controls how many entries are returned", async () => {
        const alice = await createUser();
        for (let i = 1; i <= 5; i++) await finishedRun(alice, i * 10, 1);

        const res = await api().get("/api/leaderboard?limit=2");

        expect(res.body.map((r: { score: number }) => r.score)).toEqual([50, 40]);
    });

    test.each(["0", "101", "abc", "-5"])("rejects limit=%s with 400", async (limit) => {
        const res = await api().get(`/api/leaderboard?limit=${limit}`);
        expect(res.status).toBe(400);
    });
});

describe("GET /api/leaderboard/levels (deepest stage)", () => {
    test("ranks finished runs by stage reached, highest first", async () => {
        const alice = await createUser();
        await finishedRun(alice, 999, 2);
        await finishedRun(alice, 10, 9);
        await finishedRun(alice, 50, 5);

        const res = await api().get("/api/leaderboard/levels");

        expect(res.status).toBe(200);
        expect(res.body.map((r: { level_reached: number }) => r.level_reached)).toEqual([9, 5, 2]);
    });

    test("sorts stages as numbers, so stage 10 beats stage 9", async () => {
        const alice = await createUser();
        await finishedRun(alice, 100, 9);
        await finishedRun(alice, 100, 10);

        const res = await api().get("/api/leaderboard/levels");

        expect(res.body.map((r: { level_reached: number }) => r.level_reached)).toEqual([10, 9]);
    });

    test("on a tied stage, the higher score ranks first", async () => {
        const alice = await createUser();
        await finishedRun(alice, 100, 7);
        await finishedRun(alice, 300, 7);

        const res = await api().get("/api/leaderboard/levels");

        expect(res.body.map((r: { score: number }) => r.score)).toEqual([300, 100]);
    });

    test("unfinished runs never appear", async () => {
        const alice = await createUser();
        await finishedRun(alice, 100, 2);
        await unfinishedRun(alice, 100, 40);

        const res = await api().get("/api/leaderboard/levels");

        expect(res.body.map((r: { level_reached: number }) => r.level_reached)).toEqual([2]);
    });

    test("respects ?limit=", async () => {
        const alice = await createUser();
        for (let i = 1; i <= 4; i++) await finishedRun(alice, 10, i);

        const res = await api().get("/api/leaderboard/levels?limit=3");

        expect(res.body).toHaveLength(3);
    });
});

describe("GET /api/leaderboard/players (player rankings)", () => {
    test("is empty when nobody has finished a run", async () => {
        const res = await api().get("/api/leaderboard/players");
        expect(res.status).toBe(200);
        expect(res.body).toEqual([]);
    });

    test("one row per player with best score, deepest stage, runs finished, and average score", async () => {
        const alice = await createUser("alice");
        await finishedRun(alice, 100, 8); // deepest stage, low score
        await finishedRun(alice, 500, 3); // best score, shallow stage
        await finishedRun(alice, 300, 5);

        const res = await api().get("/api/leaderboard/players");

        expect(res.status).toBe(200);
        expect(res.body).toHaveLength(1);
        expect(res.body[0]).toMatchObject({
            username: "alice",
            best_score: 500,
            deepest_level: 8,
            runs_completed: 3,
            average_score: 300,
        });
    });

    test("players are ranked by best score", async () => {
        const alice = await createUser("alice");
        const bob = await createUser("bob");
        const cara = await createUser("cara");
        await finishedRun(alice, 200, 1);
        await finishedRun(bob, 50, 1);
        await finishedRun(bob, 700, 1);
        await finishedRun(cara, 400, 1);

        const res = await api().get("/api/leaderboard/players");

        expect(res.body.map((p: { username: string }) => p.username)).toEqual(["bob", "cara", "alice"]);
    });

    test("unfinished runs don't count toward any stat", async () => {
        const alice = await createUser("alice");
        await finishedRun(alice, 100, 2);
        await unfinishedRun(alice, 9999, 30);

        const res = await api().get("/api/leaderboard/players");

        expect(res.body[0]).toMatchObject({ best_score: 100, deepest_level: 2, runs_completed: 1, average_score: 100 });
    });

    test("players who have never finished a run aren't listed", async () => {
        const alice = await createUser("alice");
        const bob = await createUser("bob");
        await finishedRun(alice, 100, 2);
        await unfinishedRun(bob, 500, 5);

        const res = await api().get("/api/leaderboard/players");

        expect(res.body.map((p: { username: string }) => p.username)).toEqual(["alice"]);
    });

    test("respects ?limit=", async () => {
        for (let i = 1; i <= 4; i++) {
            const u = await createUser();
            await finishedRun(u, i * 100, 1);
        }

        const res = await api().get("/api/leaderboard/players?limit=2");

        expect(res.body.map((p: { best_score: number }) => p.best_score)).toEqual([400, 300]);
    });
});
