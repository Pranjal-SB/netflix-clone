import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import supertest from "supertest";
import createApp from "../src/app.js";
import { query } from "../src/db.js";

function newAgent() { return supertest.agent(createApp()); }
async function csrf(agent, path) {
  return (await agent.get(path)).text.match(/name="_csrf" value="([^"]+)"/)[1];
}

beforeEach(async () => { await query("DELETE FROM users"); });

test("logged-out /browse redirects to /login", async () => {
  const res = await newAgent().get("/browse");
  assert.equal(res.status, 302);
  assert.equal(res.headers.location, "/login");
});

test("logged-in /browse renders trending row", async () => {
  const agent = newAgent();
  const t = await csrf(agent, "/signup");
  await agent.post("/signup").type("form").send({ _csrf: t, email: "eve@example.com", password: "supersecret1" });
  const res = await agent.get("/browse");
  assert.equal(res.status, 200);
  assert.match(res.text, /Trending Now/);
});
