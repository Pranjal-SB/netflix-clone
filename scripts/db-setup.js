import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { pool } from "../src/db.js";

const dir = dirname(fileURLToPath(import.meta.url));

async function run() {
  const schema = await readFile(join(dir, "../db/schema.sql"), "utf8");
  const seed = await readFile(join(dir, "../db/seed.sql"), "utf8");
  await pool.query(schema);
  await pool.query(seed);
  console.log("DB setup complete.");
  await pool.end();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
