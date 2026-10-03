import pg from "pg";
import config from "./config.js";

const isLocal = /@(localhost|127\.0\.0\.1)[:/]/.test(config.databaseUrl);

export const pool = new pg.Pool({
  connectionString: config.databaseUrl,
  ssl: isLocal ? false : true, // verify cert in prod; Supabase serves a valid chain
});

export function query(text, params) {
  return pool.query(text, params);
}
