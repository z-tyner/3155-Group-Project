/**
 * @file auth.test.ts
 * @description Supertest integration tests for user registration, duplicate signup prevention, login with valid/invalid credentials, and JWT issuance.
 */

// Endpoints not implemented yet. Fill these in once the controller exists.
describe("auth", () => {
    test.todo("registering creates an account and returns a token");
    test.todo("registering with an email that's already used is rejected");
    test.todo("logging in with the right password returns a token");
    test.todo("logging in with the wrong password is rejected");
    test.todo("requests with a missing or invalid token get 401");
});
