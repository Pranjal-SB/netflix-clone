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
async function someTitleId() {
  return (await query("SELECT id FROM titles ORDER BY id LIMIT 1")).rows[0].id;
}

beforeEach(async () => { await query("DELETE FROM users"); });

test("add then remove a title from My List; double-add is a no-op", async () => {
  const agent = newAgent();
  await loginNew(agent, "fay@example.com");
  const id = await someTitleId();

  let t = await csrf(agent, "/browse");
  await agent.post("/my-list").type("form").send({ _csrf: t, title_id: id });
  t = await csrf(agent, "/browse");
  await agent.post("/my-list").type("form").send({ _csrf: t, title_id: id });

  const page = await agent.get("/browse");
  assert.match(page.text, /My List/);
  const uid = (await query("SELECT id FROM users WHERE lower(email)=lower($1)", ["fay@example.com"])).rows[0].id;
  let count = (await query("SELECT count(*)::int AS n FROM my_list WHERE user_id=$1 AND title_id=$2", [uid, id])).rows[0].n;
  assert.equal(count, 1);

  t = await csrf(agent, "/browse");
  await agent.post(`/my-list/${id}/delete`).type("form").send({ _csrf: t });
  count = (await query("SELECT count(*)::int AS n FROM my_list WHERE user_id=$1 AND title_id=$2", [uid, id])).rows[0].n;
  assert.equal(count, 0);
});

test("logged-out POST /my-list redirects to /login and mutates nothing", async () => {
  const id = await someTitleId();
  const agent = newAgent();
  const t = await csrf(agent, "/login");
  const res = await agent.post("/my-list").type("form").send({ _csrf: t, title_id: id });
  assert.equal(res.status, 302);
  assert.equal(res.headers.location, "/login");
  const count = (await query("SELECT count(*)::int AS n FROM my_list WHERE title_id=$1", [id])).rows[0].n;
  assert.equal(count, 0);
});
