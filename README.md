# Netflix Clone

Netflix landing, sign up, and log in pages backed by a real Express + Postgres
API, with per-user accounts and a saved "My List". Coursework project, not
affiliated with Netflix.

Node 24, Express 5, EJS, PostgreSQL. Passwords hashed with argon2id, server-side
sessions in Postgres, CSRF and rate limiting on auth. Catalog, posters, and detail
pages come from the TMDB API when `TMDB_READ_TOKEN` is set; without it the app
serves a seeded local catalog so it still runs.

## Run locally

Needs Docker and Node 24+.

```bash
docker run -d --name nfpg -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=netflix -p 5432:5432 postgres:17
cp .env.example .env
npm install
npm run db:setup
npm run dev          # http://localhost:3000
```

Tests: `npm test`
