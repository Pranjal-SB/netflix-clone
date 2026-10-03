import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeItem, normalizeDetails, posterUrl } from "../src/tmdb.js";

test("posterUrl builds a CDN url and handles null", () => {
  assert.equal(posterUrl("/abc.jpg"), "https://image.tmdb.org/t/p/w342/abc.jpg");
  assert.equal(posterUrl(null), null);
});

test("normalizeItem maps a TMDB movie result to the card shape", () => {
  const item = normalizeItem({
    id: 603, title: "The Matrix", media_type: "movie",
    poster_path: "/p.jpg", backdrop_path: "/b.jpg",
    overview: "A hacker learns the truth.", release_date: "1999-03-31", vote_average: 8.7,
  });
  assert.equal(item.media_type, "movie");
  assert.equal(item.tmdb_id, "603");
  assert.equal(item.name, "The Matrix");
  assert.equal(item.year, "1999");
  assert.equal(item.rating, "8.7");
  assert.equal(item.href, "/title/movie/603");
  assert.match(item.poster_url, /image\.tmdb\.org/);
});

test("normalizeItem uses fallback type and tv name/date fields", () => {
  const item = normalizeItem(
    { id: 1399, name: "Game of Thrones", poster_path: "/g.jpg", first_air_date: "2011-04-17" },
    "tv"
  );
  assert.equal(item.media_type, "tv");
  assert.equal(item.name, "Game of Thrones");
  assert.equal(item.year, "2011");
  assert.equal(item.href, "/title/tv/1399");
});

test("normalizeDetails extracts genres, cast, and a YouTube trailer", () => {
  const d = normalizeDetails({
    id: 603, title: "The Matrix", overview: "o", release_date: "1999-03-31",
    runtime: 136, vote_average: 8.7,
    genres: [{ id: 1, name: "Action" }, { id: 2, name: "Sci-Fi" }],
    credits: { cast: [{ name: "Keanu Reeves", character: "Neo", profile_path: "/k.jpg" }] },
    videos: { results: [
      { site: "YouTube", type: "Teaser", key: "aaa" },
      { site: "YouTube", type: "Trailer", key: "m8e-FF8MsqU" },
    ] },
  }, "movie");
  assert.deepEqual(d.genres, ["Action", "Sci-Fi"]);
  assert.equal(d.runtime, 136);
  assert.equal(d.cast[0].name, "Keanu Reeves");
  assert.equal(d.trailer_key, "m8e-FF8MsqU");
});
