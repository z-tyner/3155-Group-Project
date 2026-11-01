/**
 * @file comments.test.ts
 * @description Integration tests for forum comments (/api/posts/:postId/comments and /api/comments/:commentId):
 * commenting on posts, listing a post's comments, editing, and deleting.
 */

import { api, asUser, createUser, tick } from "./helpers.js";

async function createPost(user: { id: number }, title = "A post") {
    const res = await api().post("/api/posts").set(asUser(user)).send({ title, content: "body" });
    expect(res.status).toBe(201);
    return res.body;
}

async function createComment(user: { id: number }, postId: number, content = "A comment") {
    const res = await api().post(`/api/posts/${postId}/comments`).set(asUser(user)).send({ content });
    expect(res.status).toBe(201);
    return res.body;
}

describe("POST /api/posts/:postId/comments", () => {
    test("a logged-in user can comment on a post", async () => {
        const alice = await createUser();
        const bob = await createUser();
        const post = await createPost(alice);

        const res = await api().post(`/api/posts/${post.id}/comments`).set(asUser(bob)).send({ content: "Great post" });

        expect(res.status).toBe(201);
        expect(res.body).toMatchObject({ content: "Great post", post_id: post.id, user_id: bob.id });

        const list = await api().get(`/api/posts/${post.id}/comments`);
        expect(list.body.map((c: { content: string }) => c.content)).toEqual(["Great post"]);
    });

    test("trims surrounding whitespace from the content", async () => {
        const alice = await createUser();
        const post = await createPost(alice);

        const res = await api().post(`/api/posts/${post.id}/comments`).set(asUser(alice)).send({ content: "  hi  " });

        expect(res.status).toBe(201);
        expect(res.body.content).toBe("hi");
    });

    test("requires login and saves nothing when logged out", async () => {
        const alice = await createUser();
        const post = await createPost(alice);

        const res = await api().post(`/api/posts/${post.id}/comments`).send({ content: "anon" });

        expect(res.status).toBe(401);
        const list = await api().get(`/api/posts/${post.id}/comments`);
        expect(list.body).toEqual([]);
    });

    test.each([
        ["missing content", {}],
        ["blank content", { content: "   " }],
        ["non-string content", { content: 5 }],
    ])("rejects %s with 400", async (_label, body) => {
        const alice = await createUser();
        const post = await createPost(alice);

        const res = await api().post(`/api/posts/${post.id}/comments`).set(asUser(alice)).send(body);

        expect(res.status).toBe(400);
        const list = await api().get(`/api/posts/${post.id}/comments`);
        expect(list.body).toEqual([]);
    });

    test("returns 404 when commenting on a post that does not exist", async () => {
        const alice = await createUser();
        const res = await api().post("/api/posts/999999/comments").set(asUser(alice)).send({ content: "hello?" });
        expect(res.status).toBe(404);
    });

    test("returns 400 for an invalid post id", async () => {
        const alice = await createUser();
        const res = await api().post("/api/posts/abc/comments").set(asUser(alice)).send({ content: "hello" });
        expect(res.status).toBe(400);
    });
});

describe("GET /api/posts/:postId/comments", () => {
    test("returns an empty list for a post with no comments", async () => {
        const alice = await createUser();
        const post = await createPost(alice);

        const res = await api().get(`/api/posts/${post.id}/comments`);

        expect(res.status).toBe(200);
        expect(res.body).toEqual([]);
    });

    test("returns only that post's comments, oldest first (conversation order)", async () => {
        const alice = await createUser();
        const bob = await createUser();
        const post = await createPost(alice, "Target");
        const otherPost = await createPost(alice, "Other");

        await createComment(alice, post.id, "first");
        await tick();
        await createComment(bob, otherPost.id, "wrong post");
        await tick();
        await createComment(bob, post.id, "second");
        await tick();
        await createComment(alice, post.id, "third");

        const res = await api().get(`/api/posts/${post.id}/comments`);

        expect(res.status).toBe(200);
        expect(res.body.map((c: { content: string }) => c.content)).toEqual(["first", "second", "third"]);
    });

    test("returns 404 for a post that does not exist", async () => {
        const res = await api().get("/api/posts/999999/comments");
        expect(res.status).toBe(404);
    });
});

describe("GET /api/comments/:commentId", () => {
    test("returns the requested comment", async () => {
        const alice = await createUser();
        const post = await createPost(alice);
        const comment = await createComment(alice, post.id, "find me");

        const res = await api().get(`/api/comments/${comment.id}`);

        expect(res.status).toBe(200);
        expect(res.body).toMatchObject({ id: comment.id, content: "find me", post_id: post.id });
    });

    test("returns 404 for a comment that does not exist", async () => {
        const res = await api().get("/api/comments/999999");
        expect(res.status).toBe(404);
    });

    test("returns 400 for an invalid id", async () => {
        const res = await api().get("/api/comments/abc");
        expect(res.status).toBe(400);
    });
});

describe("PATCH /api/comments/:commentId", () => {
    test("the author can edit their comment", async () => {
        const alice = await createUser();
        const post = await createPost(alice);
        const comment = await createComment(alice, post.id, "typo");

        const res = await api().patch(`/api/comments/${comment.id}`).set(asUser(alice)).send({ content: "fixed" });

        expect(res.status).toBe(200);
        expect(res.body.content).toBe("fixed");
        const fetched = await api().get(`/api/comments/${comment.id}`);
        expect(fetched.body.content).toBe("fixed");
    });

    test("another user cannot edit the comment, even the post's author", async () => {
        const alice = await createUser();
        const bob = await createUser();
        const post = await createPost(alice);
        const comment = await createComment(bob, post.id, "bob's words");

        const res = await api().patch(`/api/comments/${comment.id}`).set(asUser(alice)).send({ content: "changed" });

        expect(res.status).toBe(404);
        const fetched = await api().get(`/api/comments/${comment.id}`);
        expect(fetched.body.content).toBe("bob's words");
    });

    test("requires login", async () => {
        const alice = await createUser();
        const post = await createPost(alice);
        const comment = await createComment(alice, post.id, "original");

        const res = await api().patch(`/api/comments/${comment.id}`).send({ content: "changed" });

        expect(res.status).toBe(401);
        const fetched = await api().get(`/api/comments/${comment.id}`);
        expect(fetched.body.content).toBe("original");
    });

    test("rejects blank content with 400", async () => {
        const alice = await createUser();
        const post = await createPost(alice);
        const comment = await createComment(alice, post.id, "original");

        const res = await api().patch(`/api/comments/${comment.id}`).set(asUser(alice)).send({ content: "   " });

        expect(res.status).toBe(400);
        const fetched = await api().get(`/api/comments/${comment.id}`);
        expect(fetched.body.content).toBe("original");
    });
});

describe("DELETE /api/comments/:commentId", () => {
    test("the author can delete their comment and it disappears from the post", async () => {
        const alice = await createUser();
        const post = await createPost(alice);
        const keep = await createComment(alice, post.id, "keep");
        const remove = await createComment(alice, post.id, "remove");

        const res = await api().delete(`/api/comments/${remove.id}`).set(asUser(alice));

        expect(res.status).toBe(204);
        const list = await api().get(`/api/posts/${post.id}/comments`);
        expect(list.body.map((c: { id: number }) => c.id)).toEqual([keep.id]);
    });

    test("another user cannot delete the comment", async () => {
        const alice = await createUser();
        const bob = await createUser();
        const post = await createPost(alice);
        const comment = await createComment(bob, post.id);

        const res = await api().delete(`/api/comments/${comment.id}`).set(asUser(alice));

        expect(res.status).toBe(404);
        const fetched = await api().get(`/api/comments/${comment.id}`);
        expect(fetched.status).toBe(200);
    });

    test("requires login", async () => {
        const alice = await createUser();
        const post = await createPost(alice);
        const comment = await createComment(alice, post.id);

        const res = await api().delete(`/api/comments/${comment.id}`);

        expect(res.status).toBe(401);
        const fetched = await api().get(`/api/comments/${comment.id}`);
        expect(fetched.status).toBe(200);
    });
});
