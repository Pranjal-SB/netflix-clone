import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import supertest from "supertest";
import createApp from "../src/app.js";
import { query } from "../src/db.js";

function newAgent() { return supertest.agent(createApp()); }
async function csrf(agent, path) {
  return (await agent.get(path)).text.match(/name="_csrf" value="([^"]+)"/)[1];
}
async function loginNew(agent, email) {
  const t = await csrf(agent, "/signup");
  await agent.post("/signup").type("form").send({ _csrf: t, email, password: "supersecret1" });
}

beforeEach(async () => { await query("DELETE FROM users"); });

test("local detail page renders a seeded title with its overview", async () => {
  const agent = newAgent();
  await loginNew(agent, "det@example.com");
  const t = await query("SELECT id, name FROM titles ORDER BY id LIMIT 1");
  const { id, name } = t.rows[0];
  const res = await agent.get(`/title/local/${id}`);
  assert.equal(res.status, 200);
  assert.match(res.text, new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
});

test("unknown local title returns 404", async () => {
  const agent = newAgent();
  await loginNew(agent, "det2@example.com");
  const res = await agent.get("/title/local/99999999");
  assert.equal(res.status, 404);
});

test("logged-out detail page redirects to /login", async () => {
  const res = await newAgent().get("/title/movie/603");
  assert.equal(res.status, 302);
  assert.equal(res.headers.location, "/login");
});
