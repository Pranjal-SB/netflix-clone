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

test("add then remove a My List item; double-add is a no-op", async () => {
  const agent = newAgent();
  await loginNew(agent, "fay@example.com");
  const uid = (await query("SELECT id FROM users WHERE lower(email)=lower($1)", ["fay@example.com"])).rows[0].id;

  const add = async () => {
    const t = await csrf(agent, "/browse");
    return agent.post("/my-list").type("form").send({
      _csrf: t, media_type: "movie", tmdb_id: "603", name: "The Matrix", poster_url: "/x.jpg",
    });
  };
  await add();
  await add(); // duplicate

  let n = (await query("SELECT count(*)::int AS n FROM my_list WHERE user_id=$1", [uid])).rows[0].n;
  assert.equal(n, 1, "duplicate add must not create a second row");

  const page = await agent.get("/browse");
  assert.match(page.text, /My List/);
  assert.match(page.text, /The Matrix/);

  const t = await csrf(agent, "/browse");
  await agent.post("/my-list/remove").type("form").send({ _csrf: t, media_type: "movie", tmdb_id: "603" });
  n = (await query("SELECT count(*)::int AS n FROM my_list WHERE user_id=$1", [uid])).rows[0].n;
  assert.equal(n, 0);
});

test("logged-out POST /my-list redirects to /login and mutates nothing", async () => {
  const agent = newAgent();
  const t = await csrf(agent, "/login");
  const res = await agent.post("/my-list").type("form").send({
    _csrf: t, media_type: "movie", tmdb_id: "603", name: "X", poster_url: "",
  });
  assert.equal(res.status, 302);
  assert.equal(res.headers.location, "/login");
  const n = (await query("SELECT count(*)::int AS n FROM my_list")).rows[0].n;
  assert.equal(n, 0);
});

test("add with unknown media_type is ignored (no row, no crash)", async () => {
  const agent = newAgent();
  await loginNew(agent, "bad@example.com");
  const uid = (await query("SELECT id FROM users WHERE lower(email)=lower($1)", ["bad@example.com"])).rows[0].id;
  const t = await csrf(agent, "/browse");
  const res = await agent.post("/my-list").type("form").send({
    _csrf: t, media_type: "bogus", tmdb_id: "1", name: "Y", poster_url: "",
  });
  assert.equal(res.status, 302);
  const n = (await query("SELECT count(*)::int AS n FROM my_list WHERE user_id=$1", [uid])).rows[0].n;
  assert.equal(n, 0);
});
