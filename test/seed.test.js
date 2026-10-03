import { test } from "node:test";
import assert from "node:assert/strict";
import { query } from "../src/db.js";

test("seed inserts ~30 titles and exactly 10 trending", async () => {
  const total = await query("SELECT count(*)::int AS n FROM titles");
  assert.ok(total.rows[0].n >= 28, `expected >=28 titles, got ${total.rows[0].n}`);
  const trending = await query("SELECT count(*)::int AS n FROM titles WHERE trending_rank IS NOT NULL");
  assert.equal(trending.rows[0].n, 10);
});
