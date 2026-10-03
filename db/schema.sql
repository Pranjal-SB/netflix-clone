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

CREATE TABLE IF NOT EXISTS my_list (
  user_id bigint NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title_id int NOT NULL REFERENCES titles(id) ON DELETE CASCADE,
  added_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, title_id)
);
