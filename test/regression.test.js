import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import supertest from "supertest";
import createApp from "../src/app.js";
import { query } from "../src/db.js";
import { getGenres } from "../src/catalog.js";

function newAgent() { return supertest.agent(createApp()); }
async function csrf(agent, path) {
  return (await agent.get(path)).text.match(/name="_csrf" value="([^"]+)"/)[1];
}
async function loginNew(agent, email) {
  const t = await csrf(agent, "/signup");
  await agent.post("/signup").type("form").send({ _csrf: t, email, password: "supersecret1" });
}

beforeEach(async () => { await query("DELETE FROM users"); });

// Fix #1: static assets must not run session middleware (no Set-Cookie, no DB touch).
test("static asset response sets no session cookie", async () => {
  const res = await supertest(createApp()).get("/css/style.css");
  assert.equal(res.status, 200);
  assert.equal(res.headers["set-cookie"], undefined);
});

// Fix #2: a state-changing POST with no form body must 403, not crash with 500.
test("POST /logout with no form body returns 403 (not 500)", async () => {
  const agent = newAgent();
  await agent.get("/login"); // establish session
  const res = await agent.post("/logout").set("Content-Type", "application/json").send("{}");
  assert.equal(res.status, 403);
});

// Fix #3: my-list add with missing/invalid fields must not 500, adds nothing.
test("POST /my-list with missing fields redirects, does not 500, adds nothing", async () => {
  const agent = newAgent();
  await loginNew(agent, "reg@example.com");
  const t = await csrf(agent, "/browse");
  const res = await agent.post("/my-list").type("form").send({ _csrf: t, media_type: "movie" });
  assert.equal(res.status, 302);
  const n = (await query("SELECT count(*)::int AS n FROM my_list")).rows[0].n;
  assert.equal(n, 0);
});

// Fix #4: genre grouping must not emit a row literally titled "Trending".
test("getGenres emits no genre named Trending", async () => {
  const genres = await getGenres();
  assert.ok(!genres.some((g) => g.genre === "Trending"), "found a 'Trending' genre row");
});
