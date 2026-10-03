# Netflix Clone

Three Netflix pages (landing, sign up, log in) with a real backend: account
creation, password login, and a per-user **My List**. Built for coursework.
Not affiliated with Netflix.

## Stack

- Node 24, Express 5, EJS, plain CSS (no build step)
- PostgreSQL via `pg` (Docker locally, Supabase in production)
- Server-side sessions in Postgres (`express-session` + `connect-pg-simple`)
- Passwords hashed with argon2id (`@node-rs/argon2`)
- `helmet`, `express-rate-limit`, `csrf-sync`
- Tests: `node:test` + `supertest`

## What it does

- Landing page: hero, email capture, Trending Now row, FAQ.
- Sign up: real account, email + password (8–128 chars), argon2id hash.
- Log in / log out: server-side session, regenerated on auth.
- Browse (auth-only): featured title, My List, trending and genre rows.
- My List: add/remove any title — persisted per user in Postgres.

## Local setup

Needs Docker (for Postgres) and Node 24+.

```bash
# 1. start Postgres
docker run -d --name nfpg -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=netflix -p 5432:5432 postgres:17

# 2. env
cp .env.example .env    # defaults already point at the container above

# 3. install + seed
npm install
npm run db:setup        # applies db/schema.sql + db/seed.sql

# 4. run
npm run dev             # http://localhost:3000
```

## Tests

```bash
npm test
```

Requires the Postgres container running and `npm run db:setup` done once
(the suite seeds titles but reads them from the DB). Tests run serially
(`--test-concurrency=1`) because they share one database.

## Environment variables

| Var | Purpose |
|-----|---------|
| `DATABASE_URL` | Postgres connection string |
| `SESSION_SECRET` | session cookie signing secret |
| `NODE_ENV` | `production` enables secure cookies + verified TLS to the DB |
| `PORT` | listen port (default 3000) |

## Deploy (Render + Supabase)

1. Create a Supabase project. In **Connect**, copy the **Session pooler**
   connection string (port 5432) — the direct host is IPv6-only and Render
   cannot reach it. That string is `DATABASE_URL`.
2. Create a Render **Web Service** from this repo. `render.yaml` sets build
   (`npm ci`), start (`npm start`), health check (`/healthz`), and generates
   `SESSION_SECRET`. Set `DATABASE_URL` to the Supabase string.
3. Run the schema + seed once against Supabase:
   `DATABASE_URL="<supabase>" npm run db:setup`.

Notes: Render's free web service sleeps after ~15 min idle and takes ~1 min
to wake. A free Supabase project pauses after ~7 days idle — open the site
once to wake it before it's needed.
