import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import supertest from "supertest";
import createApp from "../src/app.js";
import { query } from "../src/db.js";

function newAgent() { return supertest.agent(createApp()); }
async function csrf(agent, path) {
  const res = await agent.get(path);
  return res.text.match(/name="_csrf" value="([^"]+)"/)[1];
}
async function register(agent, email, password) {
  const t = await csrf(agent, "/signup");
  return agent.post("/signup").type("form").send({ _csrf: t, email, password });
}

beforeEach(async () => { await query("DELETE FROM users"); });

test("login with correct password redirects to /browse", async () => {
  const agent = newAgent();
  await register(agent, "cara@example.com", "supersecret1");
  const lt = await csrf(agent, "/login");
  await agent.post("/logout").type("form").send({ _csrf: lt });
  const t = await csrf(agent, "/login");
  const res = await agent.post("/login").type("form").send({ _csrf: t, email: "cara@example.com", password: "supersecret1" });
  assert.equal(res.status, 302);
  assert.equal(res.headers.location, "/browse");
});

test("login with wrong password fails with generic message", async () => {
  const agent = newAgent();
  await register(agent, "dan@example.com", "supersecret1");
  const lt = await csrf(agent, "/login");
  await agent.post("/logout").type("form").send({ _csrf: lt });
  const t = await csrf(agent, "/login");
  const res = await agent.post("/login").type("form").send({ _csrf: t, email: "dan@example.com", password: "wrongpass1" });
  assert.equal(res.status, 401);
  assert.match(res.text, /Incorrect email or password/);
  const b = await agent.get("/browse");
  assert.equal(b.status, 302);
  assert.equal(b.headers.location, "/login");
});
