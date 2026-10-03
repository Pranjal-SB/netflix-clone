import { test } from "node:test";
import assert from "node:assert/strict";
import { query } from "../src/db.js";

test("db connects and runs a trivial query", async () => {
  const r = await query("SELECT 1 AS one");
  assert.equal(r.rows[0].one, 1);
});
