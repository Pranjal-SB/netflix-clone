CREATE TABLE IF NOT EXISTS users (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  email text NOT NULL,
  password_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS users_email_lower ON users (lower(email));

CREATE TABLE IF NOT EXISTS titles (
  id int GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name text NOT NULL,
  year int,
  genre text NOT NULL,
  synopsis text,
  poster text NOT NULL,
  trending_rank int
);

-- My List stores a snapshot of each saved item (name + poster) keyed by its
-- source and id, so the list renders without re-calling TMDB. media_type is
-- 'movie' or 'tv' for TMDB items, or 'local' for seeded fallback catalog items
-- (where tmdb_id holds the local titles.id as text).
CREATE TABLE IF NOT EXISTS my_list (
  user_id bigint NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  media_type text NOT NULL,
  tmdb_id text NOT NULL,
  name text NOT NULL,
  poster_url text NOT NULL,
  added_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, media_type, tmdb_id)
);
