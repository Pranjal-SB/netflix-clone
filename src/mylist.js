import { query } from "./db.js";

const TYPES = new Set(["movie", "tv", "local"]);

export function listKey(media_type, tmdb_id) {
  return `${media_type}:${tmdb_id}`;
}

export async function add(userId, { media_type, tmdb_id, name, poster_url }) {
  if (!TYPES.has(media_type) || !tmdb_id || !name) return;
  await query(
    `INSERT INTO my_list (user_id, media_type, tmdb_id, name, poster_url)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (user_id, media_type, tmdb_id) DO NOTHING`,
    [userId, media_type, String(tmdb_id), name, poster_url || ""]
  );
}

export async function remove(userId, media_type, tmdb_id) {
  await query(
    "DELETE FROM my_list WHERE user_id = $1 AND media_type = $2 AND tmdb_id = $3",
    [userId, media_type, String(tmdb_id)]
  );
}

export async function listFor(userId) {
  const r = await query(
    `SELECT media_type, tmdb_id, name, poster_url FROM my_list
     WHERE user_id = $1 ORDER BY added_at DESC`,
    [userId]
  );
  return r.rows.map((x) => ({
    media_type: x.media_type,
    tmdb_id: x.tmdb_id,
    name: x.name,
    poster_url: x.poster_url,
    href: `/title/${x.media_type}/${x.tmdb_id}`,
  }));
}

export async function keySet(userId) {
  const rows = await listFor(userId);
  return new Set(rows.map((x) => listKey(x.media_type, x.tmdb_id)));
}
