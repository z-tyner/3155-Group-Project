/**
 * @file auth.test.ts
 * @description Supertest integration tests for user registration, duplicate signup prevention, login with valid/invalid credentials, and JWT issuance.
 */

import { api, resetDatabase } from "./helpers.js";

describe("auth", () => {
    beforeEach(async () => {
        await resetDatabase();
    });

    test("registering creates an account and returns a token", async () => {
        const res = await api().post("/api/auth/signup").send({
            username: "tester",
            email: "tester@example.com",
            password: "supersecret123"
        });

        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty("token");
        expect(res.body.user).toMatchObject({
            username: "tester",
            email: "tester@example.com"
        });
        expect(res.body.user).toHaveProperty("id");
        expect(res.body.user).not.toHaveProperty("password_hash");
    });

    test("registering with an email that's already used is rejected", async () => {
        await api().post("/api/auth/signup").send({
            username: "tester1",
            email: "duplicate@example.com",
            password: "password123"
        });

        const res = await api().post("/api/auth/signup").send({
            username: "tester2",
            email: "duplicate@example.com",
            password: "password456"
        });

        expect(res.status).toBe(409);
        expect(res.body).toHaveProperty("message");
    });

    test("logging in with the right password returns a token", async () => {
        await api().post("/api/auth/signup").send({
            username: "loginUser",
            email: "login@example.com",
            password: "correctpassword"
        });

        const res = await api().post("/api/auth/login").send({
            email: "login@example.com",
            password: "correctpassword"
        });

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty("token");
        expect(res.body.user).toMatchObject({
            username: "loginUser",
            email: "login@example.com"
        });
        expect(res.body.user).not.toHaveProperty("password_hash");
    });

    test("logging in with the wrong password is rejected", async () => {
        await api().post("/api/auth/signup").send({
            username: "wrongUser",
            email: "wrong@example.com",
            password: "correctpassword"
        });

        const res = await api().post("/api/auth/login").send({
            email: "wrong@example.com",
            password: "wrongpassword"
        });

        expect(res.status).toBe(401);
        expect(res.body).toHaveProperty("message");
    });

    test("requests with a missing or invalid token get 401", async () => {
        // Missing token
        const missingRes = await api().get("/api/auth/me");
        expect(missingRes.status).toBe(401);

        // Invalid token
        const invalidRes = await api()
            .get("/api/auth/me")
            .set("Authorization", "Bearer invalid.token.here");
        expect(invalidRes.status).toBe(401);

        // Valid token
        const signupRes = await api().post("/api/auth/signup").send({
            username: "validTokenUser",
            email: "valid@example.com",
            password: "password123"
        });

        const token = signupRes.body.token;
        const validRes = await api()
            .get("/api/auth/me")
            .set("Authorization", `Bearer ${token}`);

        expect(validRes.status).toBe(200);
        expect(validRes.body.user).toMatchObject({
            username: "validTokenUser",
            email: "valid@example.com"
        });
    });
});
