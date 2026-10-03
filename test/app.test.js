import { test } from "node:test";
import assert from "node:assert/strict";
import supertest from "supertest";
import createApp from "../src/app.js";

const request = supertest(createApp());

test("GET /healthz returns ok", async () => {
  const res = await request.get("/healthz");
  assert.equal(res.status, 200);
  assert.equal(res.text, "ok");
});
