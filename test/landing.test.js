import { test } from "node:test";
import assert from "node:assert/strict";
import supertest from "supertest";
import createApp from "../src/app.js";

test("landing renders hero and trending", async () => {
  const res = await supertest(createApp()).get("/");
  assert.equal(res.status, 200);
  assert.match(res.text, /Unlimited movies, shows and more/);
  assert.match(res.text, /Trending Now/);
  assert.match(res.text, /Frequently Asked Questions/);
});
