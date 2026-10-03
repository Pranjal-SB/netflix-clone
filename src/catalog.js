import { query } from "./db.js";

export async function getTrending() {
  const r = await query("SELECT * FROM titles WHERE trending_rank IS NOT NULL ORDER BY trending_rank");
  return r.rows;
}

export async function getGenres() {
  const r = await query("SELECT * FROM titles WHERE trending_rank IS NULL ORDER BY genre, name");
  const map = new Map();
  for (const t of r.rows) {
    if (!map.has(t.genre)) map.set(t.genre, []);
    map.get(t.genre).push(t);
  }
  return [...map.entries()].map(([genre, titles]) => ({ genre, titles }));
}
