function required(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}

const config = {
  databaseUrl: required("DATABASE_URL"),
  sessionSecret: required("SESSION_SECRET"),
  isProd: process.env.NODE_ENV === "production",
  port: Number(process.env.PORT) || 3000,
  // Optional: TMDB v4 read access token. When absent, the app serves the
  // seeded local catalog instead of live TMDB data.
  tmdbToken: process.env.TMDB_READ_TOKEN || null,
};

export default config;
