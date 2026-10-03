import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import supertest from "supertest";
import createApp from "../src/app.js";
import { query } from "../src/db.js";

const agent = supertest.agent(createApp());

async function csrf(path) {
  const res = await agent.get(path);
  const m = res.text.match(/name="_csrf" value="([^"]+)"/);
  return m[1];
}

beforeEach(async () => {
  await query("DELETE FROM users");
});

test("signup creates a user with a hashed (non-plaintext) password", async () => {
  const token = await csrf("/signup");
  const res = await agent.post("/signup").type("form").send({
    _csrf: token, email: "alice@example.com", password: "supersecret1",
  });
  assert.equal(res.status, 302);
  assert.equal(res.headers.location, "/browse");
  const r = await query("SELECT password_hash FROM users WHERE lower(email)=lower($1)", ["alice@example.com"]);
  assert.equal(r.rowCount, 1);
  assert.notEqual(r.rows[0].password_hash, "supersecret1");
  assert.match(r.rows[0].password_hash, /^\$argon2id\$/);
});

test("duplicate email (different case) is rejected", async () => {
  let token = await csrf("/signup");
  await agent.post("/signup").type("form").send({ _csrf: token, email: "bob@example.com", password: "supersecret1" });
  token = await csrf("/signup");
  const res = await agent.post("/signup").type("form").send({ _csrf: token, email: "BOB@example.com", password: "supersecret1" });
  assert.equal(res.status, 409);
  assert.match(res.text, /already exists/);
  const r = await query("SELECT count(*)::int AS n FROM users WHERE lower(email)=lower($1)", ["bob@example.com"]);
  assert.equal(r.rows[0].n, 1);
});
