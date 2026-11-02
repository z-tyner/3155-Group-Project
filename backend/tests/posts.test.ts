/**
 * @file posts.test.ts
 * @description Integration tests for forum posts (/api/posts): creating, listing, reading, editing, and deleting,
 * including login requirements and "only the author can change it" rules.
 */

import { db } from "../src/config/db.js";
import { api, asUser, createUser, tick } from "./helpers.js";

async function createPost(user: { id: number }, title = "Best cheese?", content = "Discuss.") {
    const res = await api().post("/api/posts").set(asUser(user)).send({ title, content });
    expect(res.status).toBe(201);
    return res.body;
}

describe("POST /api/posts", () => {
    test("a logged-in user can create a post and it is saved under their account", async () => {
        const alice = await createUser("alice");

        const res = await api().post("/api/posts").set(asUser(alice)).send({ title: "Hello", content: "First post" });

        expect(res.status).toBe(201);
        expect(res.body).toMatchObject({ title: "Hello", content: "First post", user_id: alice.id });
        expect(typeof res.body.id).toBe("number");

        // It really exists afterwards
        const fetched = await api().get(`/api/posts/${res.body.id}`);
        expect(fetched.status).toBe(200);
        expect(fetched.body.title).toBe("Hello");
    });

    test("requires login and saves nothing when logged out", async () => {
        const res = await api().post("/api/posts").send({ title: "Hello", content: "First post" });

        expect(res.status).toBe(401);
        const list = await api().get("/api/posts");
        expect(list.body).toEqual([]);
    });

    test("the author is the logged-in user, even if the body claims someone else", async () => {
        const alice = await createUser("alice");
        const bob = await createUser("bob");

        const res = await api().post("/api/posts").set(asUser(alice)).send({ title: "Hi", content: "x", user_id: bob.id });

        expect(res.status).toBe(201);
        expect(res.body.user_id).toBe(alice.id);
    });

    test("trims surrounding whitespace from title and content", async () => {
        const alice = await createUser();

        const res = await api().post("/api/posts").set(asUser(alice)).send({ title: "  Spaced  ", content: "\n body \t" });

        expect(res.status).toBe(201);
        expect(res.body.title).toBe("Spaced");
        expect(res.body.content).toBe("body");
    });

    test.each([
        ["missing title", { content: "body" }],
        ["missing content", { title: "title" }],
        ["blank title", { title: "   ", content: "body" }],
        ["blank content", { title: "title", content: "   " }],
        ["non-string title", { title: 42, content: "body" }],
        ["empty body", {}],
    ])("rejects %s with 400 and saves nothing", async (_label, body) => {
        const alice = await createUser();

        const res = await api().post("/api/posts").set(asUser(alice)).send(body);

        expect(res.status).toBe(400);
        const count = await db.selectFrom("posts").select(db.fn.countAll().as("n")).executeTakeFirstOrThrow();
        expect(Number(count.n)).toBe(0);
    });
});

describe("GET /api/posts", () => {
    test("returns an empty list when there are no posts", async () => {
        const res = await api().get("/api/posts");

        expect(res.status).toBe(200);
        expect(res.body).toEqual([]);
    });

    test("returns every post, newest first, without requiring login", async () => {
        const alice = await createUser();
        const bob = await createUser();
        await createPost(alice, "Oldest");
        await tick();
        await createPost(bob, "Middle");
        await tick();
        await createPost(alice, "Newest");

        const res = await api().get("/api/posts");

        expect(res.status).toBe(200);
        expect(res.body.map((p: { title: string }) => p.title)).toEqual(["Newest", "Middle", "Oldest"]);
    });
});

describe("GET /api/posts/:id", () => {
    test("returns the requested post", async () => {
        const alice = await createUser();
        const post = await createPost(alice, "Find me", "Here I am");
        await createPost(alice, "Not me");

        const res = await api().get(`/api/posts/${post.id}`);

        expect(res.status).toBe(200);
        expect(res.body).toMatchObject({ id: post.id, title: "Find me", content: "Here I am" });
    });

    test("returns 404 for a post that does not exist", async () => {
        const res = await api().get("/api/posts/999999");
        expect(res.status).toBe(404);
    });

    test.each(["abc", "0", "-5", "1.5"])("returns 400 for invalid id %s", async (id) => {
        const res = await api().get(`/api/posts/${id}`);
        expect(res.status).toBe(400);
    });
});

describe("PATCH /api/posts/:id", () => {
    test("the author can edit just the title and the content stays the same", async () => {
        const alice = await createUser();
        const post = await createPost(alice, "Old title", "Keep this");

        const res = await api().patch(`/api/posts/${post.id}`).set(asUser(alice)).send({ title: "New title" });

        expect(res.status).toBe(200);
        expect(res.body).toMatchObject({ title: "New title", content: "Keep this" });

        const fetched = await api().get(`/api/posts/${post.id}`);
        expect(fetched.body).toMatchObject({ title: "New title", content: "Keep this" });
    });

    test("editing moves updated_at forward but leaves created_at alone", async () => {
        const alice = await createUser();
        const post = await createPost(alice);
        await tick();

        const res = await api().patch(`/api/posts/${post.id}`).set(asUser(alice)).send({ content: "edited" });

        expect(res.status).toBe(200);
        expect(new Date(res.body.updated_at).getTime()).toBeGreaterThan(new Date(post.updated_at).getTime());
        expect(res.body.created_at).toBe(post.created_at);
    });

    test("another user cannot edit the post, and it stays unchanged", async () => {
        const alice = await createUser();
        const bob = await createUser();
        const post = await createPost(alice, "Alice's title", "Alice's words");

        const res = await api().patch(`/api/posts/${post.id}`).set(asUser(bob)).send({ title: "Hacked" });

        expect(res.status).toBe(404);
        const fetched = await api().get(`/api/posts/${post.id}`);
        expect(fetched.body.title).toBe("Alice's title");
    });

    test("requires login", async () => {
        const alice = await createUser();
        const post = await createPost(alice, "Original");

        const res = await api().patch(`/api/posts/${post.id}`).send({ title: "Changed" });

        expect(res.status).toBe(401);
        const fetched = await api().get(`/api/posts/${post.id}`);
        expect(fetched.body.title).toBe("Original");
    });

    test.each([
        ["no fields", {}],
        ["blank title", { title: "  " }],
        ["blank content", { content: "" }],
        ["non-string content", { content: 123 }],
    ])("rejects %s with 400", async (_label, body) => {
        const alice = await createUser();
        const post = await createPost(alice, "Original", "Original body");

        const res = await api().patch(`/api/posts/${post.id}`).set(asUser(alice)).send(body);

        expect(res.status).toBe(400);
        const fetched = await api().get(`/api/posts/${post.id}`);
        expect(fetched.body).toMatchObject({ title: "Original", content: "Original body" });
    });

    test("returns 404 when editing a post that does not exist", async () => {
        const alice = await createUser();
        const res = await api().patch("/api/posts/999999").set(asUser(alice)).send({ title: "x" });
        expect(res.status).toBe(404);
    });
});

describe("DELETE /api/posts/:id", () => {
    test("the author can delete their post and it is gone afterwards", async () => {
        const alice = await createUser();
        const post = await createPost(alice);

        const res = await api().delete(`/api/posts/${post.id}`).set(asUser(alice));

        expect(res.status).toBe(204);
        const fetched = await api().get(`/api/posts/${post.id}`);
        expect(fetched.status).toBe(404);
    });

    test("deleting the same post twice returns 404 the second time", async () => {
        const alice = await createUser();
        const post = await createPost(alice);

        await api().delete(`/api/posts/${post.id}`).set(asUser(alice));
        const second = await api().delete(`/api/posts/${post.id}`).set(asUser(alice));

        expect(second.status).toBe(404);
    });

    test("another user cannot delete the post", async () => {
        const alice = await createUser();
        const bob = await createUser();
        const post = await createPost(alice);

        const res = await api().delete(`/api/posts/${post.id}`).set(asUser(bob));

        expect(res.status).toBe(404);
        const fetched = await api().get(`/api/posts/${post.id}`);
        expect(fetched.status).toBe(200);
    });

    test("requires login", async () => {
        const alice = await createUser();
        const post = await createPost(alice);

        const res = await api().delete(`/api/posts/${post.id}`);

        expect(res.status).toBe(401);
        const fetched = await api().get(`/api/posts/${post.id}`);
        expect(fetched.status).toBe(200);
    });

    test("the author can delete a post that has comments on it", async () => {
        const alice = await createUser();
        const bob = await createUser();
        const post = await createPost(alice);
        // Comment inserted directly so this test doesn't depend on the comment endpoints
        await db.insertInto("comments").values({ user_id: bob.id, post_id: post.id, content: "Nice post" }).execute();

        const res = await api().delete(`/api/posts/${post.id}`).set(asUser(alice));

        expect(res.status).toBe(204);
        const fetched = await api().get(`/api/posts/${post.id}`);
        expect(fetched.status).toBe(404);
    });
});
