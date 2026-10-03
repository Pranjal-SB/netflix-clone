import { query } from "./db.js";
import * as tmdb from "./tmdb.js";
import { getTrending as localTrending, getGenres as localGenres } from "./catalog.js";

// Map a local DB title row into the same normalized shape TMDB items use.
function fromLocal(t) {
  return {
    media_type: "local",
    tmdb_id: String(t.id),
    name: t.name,
    poster_url: t.poster,
    backdrop_url: t.poster,
    overview: t.synopsis || "",
    year: t.year ? String(t.year) : null,
    rating: null,
    href: `/title/local/${t.id}`,
  };
}

export function sourceIsTmdb() {
  return tmdb.isEnabled();
}

// Rows for the browse page: live TMDB when a token is set, else local catalog.
export async function browseRows(fetchImpl) {
  if (tmdb.isEnabled()) return tmdb.getBrowseRows(fetchImpl);
  const [trending, genres] = await Promise.all([localTrending(), localGenres()]);
  const rows = [{ title: "Trending Now", items: trending.map(fromLocal) }];
  for (const g of genres) rows.push({ title: g.genre, items: g.titles.map(fromLocal) });
  return rows;
}

// Trending row for the landing page.
export async function trendingRow(fetchImpl) {
  if (tmdb.isEnabled()) return tmdb.getTrending(fetchImpl);
  const rows = await localTrending();
  return rows.map(fromLocal);
}

// Full detail for a title page. type 'local' reads the seeded catalog.
export async function detail(type, id, fetchImpl) {
  if (type === "local") {
    const r = await query("SELECT * FROM titles WHERE id = $1", [Number(id)]);
    if (!r.rowCount) return null;
    const t = r.rows[0];
    return {
      media_type: "local",
      tmdb_id: String(t.id),
      name: t.name,
      overview: t.synopsis || "",
      poster_url: t.poster,
      backdrop_url: t.poster,
      year: t.year ? String(t.year) : null,
      rating: null,
      runtime: null,
      genres: t.genre ? [t.genre] : [],
      cast: [],
      trailer_key: null,
    };
  }
  if (type !== "movie" && type !== "tv") return null;
  if (!tmdb.isEnabled()) return null;
  return tmdb.getDetails(type, id, fetchImpl);
}
