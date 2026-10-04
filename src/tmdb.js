import config from "./config.js";

const BASE = "https://api.themoviedb.org/3";
const IMG = "https://image.tmdb.org/t/p";
const CACHE_TTL_MS = 60 * 60 * 1000; // 1h

const cache = new Map(); // key -> { exp, data }

export function isEnabled() {
  return Boolean(config.tmdbToken);
}

export function posterUrl(path, size = "w342") {
  return path ? `${IMG}/${size}${path}` : null;
}
export function backdropUrl(path, size = "original") {
  return path ? `${IMG}/${size}${path}` : null;
}

// Normalize a TMDB movie/tv result into the shape the card/list use.
// `fallbackType` applies to /trending/all mixed results that omit media_type.
export function normalizeItem(raw, fallbackType) {
  const media_type = raw.media_type === "movie" || raw.media_type === "tv"
    ? raw.media_type
    : fallbackType;
  const name = raw.title || raw.name || "Untitled";
  const date = raw.release_date || raw.first_air_date || "";
  return {
    media_type,
    tmdb_id: String(raw.id),
    name,
    poster_url: posterUrl(raw.poster_path),
    backdrop_url: backdropUrl(raw.backdrop_path),
    overview: raw.overview || "",
    year: date ? date.slice(0, 4) : null,
    rating: raw.vote_average ? Number(raw.vote_average).toFixed(1) : null,
    href: `/title/${media_type}/${raw.id}`,
  };
}

// Normalize a full details response (append_to_response=credits,videos).
export function normalizeDetails(raw, type) {
  const date = raw.release_date || raw.first_air_date || "";
  const trailer = (raw.videos?.results || []).find(
    (v) => v.site === "YouTube" && v.type === "Trailer"
  );
  const logos = raw.images?.logos || [];
  const logo = logos.find((l) => l.iso_639_1 === "en") || logos[0];
  return {
    media_type: type,
    tmdb_id: String(raw.id),
    name: raw.title || raw.name || "Untitled",
    overview: raw.overview || "",
    poster_url: posterUrl(raw.poster_path, "w500"),
    backdrop_url: backdropUrl(raw.backdrop_path),
    logo_url: logo ? posterUrl(logo.file_path, "w500") : null,
    year: date ? date.slice(0, 4) : null,
    rating: raw.vote_average ? Number(raw.vote_average).toFixed(1) : null,
    runtime: raw.runtime || raw.episode_run_time?.[0] || null,
    genres: (raw.genres || []).map((g) => g.name),
    cast: (raw.credits?.cast || []).slice(0, 10).map((c) => ({
      name: c.name,
      character: c.character,
      profile_url: posterUrl(c.profile_path, "w185"),
    })),
    trailer_key: trailer ? trailer.key : null,
  };
}

async function tmdbGet(path, params = {}, fetchImpl = globalThis.fetch) {
  if (!isEnabled()) throw new Error("TMDB token not configured");
  const url = new URL(BASE + path);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const key = url.toString();
  const hit = cache.get(key);
  if (hit && hit.exp > Date.now()) return hit.data;

  const res = await fetchImpl(key, {
    headers: { Authorization: `Bearer ${config.tmdbToken}`, accept: "application/json" },
  });
  if (!res.ok) throw new Error(`TMDB ${res.status} for ${path}`);
  const data = await res.json();
  cache.set(key, { exp: Date.now() + CACHE_TTL_MS, data });
  return data;
}

const ROWS = [
  { title: "Trending Now",   subtitle: "What everyone is watching this week",  path: "/trending/all/week",  fallback: "movie" },
  { title: "Popular Movies", subtitle: "The most-watched films right now",      path: "/movie/popular",      fallback: "movie" },
  { title: "Top Rated",      subtitle: "Highest rated across all time",         path: "/movie/top_rated",    fallback: "movie" },
  { title: "Popular TV",     subtitle: "Series everyone is talking about",      path: "/tv/popular",         fallback: "tv"    },
];

export async function getBrowseRows(fetchImpl) {
  const rows = await Promise.all(
    ROWS.map(async (r) => {
      const data = await tmdbGet(r.path, {}, fetchImpl);
      const items = (data.results || [])
        .map((x) => normalizeItem(x, r.fallback))
        .filter((x) => x.poster_url);
      return { title: r.title, subtitle: r.subtitle || null, items };
    })
  );
  return rows.filter((r) => r.items.length);
}

export async function getTrending(fetchImpl) {
  const data = await tmdbGet("/trending/all/week", {}, fetchImpl);
  return (data.results || [])
    .map((x) => normalizeItem(x, "movie"))
    .filter((x) => x.poster_url)
    .slice(0, 10);
}

export async function getDetails(type, id, fetchImpl) {
  const data = await tmdbGet(
    `/${type}/${id}`,
    { append_to_response: "credits,videos,images", include_image_language: "en,null" },
    fetchImpl
  );
  return normalizeDetails(data, type);
}

// test-only: clear the module cache between cases
export function _clearCache() {
  cache.clear();
}
