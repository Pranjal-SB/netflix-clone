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

export async function getFeatured() {
  const r = await query("SELECT * FROM titles WHERE trending_rank = 1 LIMIT 1");
  return r.rows[0] || null;
}

export async function getUserList(userId) {
  const r = await query(
    `SELECT t.* FROM titles t JOIN my_list m ON m.title_id = t.id
     WHERE m.user_id = $1 ORDER BY m.added_at DESC`,
    [userId]
  );
  return r.rows;
}
