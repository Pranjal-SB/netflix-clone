import { test } from "node:test";
import assert from "node:assert/strict";
import supertest from "supertest";
import createApp from "../src/app.js";

test("POST /signup without CSRF token is rejected with 403", async () => {
  const agent = supertest.agent(createApp());
  await agent.get("/signup");
  const res = await agent.post("/signup").type("form").send({
    email: "no-csrf@example.com", password: "supersecret1",
  });
  assert.equal(res.status, 403);
});

test("POST /my-list without CSRF token is rejected with 403", async () => {
  const agent = supertest.agent(createApp());
  await agent.get("/login");
  const res = await agent.post("/my-list").type("form").send({ title_id: 1 });
  assert.equal(res.status, 403);
});
