import express from "express";
import helmet from "helmet";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { csrfSync } from "csrf-sync";
import rateLimit from "express-rate-limit";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import config from "./config.js";
import { pool } from "./db.js";
import { homeRouter } from "./home.js";
import { authRouter } from "./auth.js";
import { browseRouter } from "./browse.js";

const dir = dirname(fileURLToPath(import.meta.url));

export default function createApp() {
  const app = express();
  app.set("trust proxy", 1);
  app.set("view engine", "ejs");
  app.set("views", join(dir, "views"));

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "https://fonts.googleapis.com", "'unsafe-inline'"],
          fontSrc: ["'self'", "https://fonts.gstatic.com"],
          imgSrc: ["'self'", "data:"],
          scriptSrc: ["'self'"],
        },
      },
    })
  );
  app.use(express.urlencoded({ extended: false }));

  // Static assets and health check need neither session nor CSRF — mount them
  // before the session middleware so they don't trigger a session-store round-trip.
  app.use(express.static(join(dir, "..", "public")));
  app.get("/healthz", (_req, res) => res.type("text").send("ok"));

  const PgStore = connectPgSimple(session);
  app.use(
    session({
      store: new PgStore({ pool, tableName: "session", createTableIfMissing: true }),
      secret: config.sessionSecret,
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        sameSite: "lax",
        secure: config.isProd,
        maxAge: 7 * 24 * 60 * 60 * 1000,
      },
    })
  );

  const { csrfSynchronisedProtection, generateToken, invalidCsrfTokenError } = csrfSync({
    getTokenFromRequest: (req) => req.body?._csrf,
  });
  app.use(csrfSynchronisedProtection);
  app.use((req, res, next) => {
    res.locals.csrfToken = generateToken(req);
    res.locals.userId = req.session.userId || null;
    next();
  });

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: "Too many attempts. Try again later.",
  });
  app.use(["/login", "/signup"], (req, res, next) =>
    req.method === "POST" ? authLimiter(req, res, next) : next()
  );

  app.use(homeRouter);
  app.use(authRouter);
  app.use(browseRouter);

  app.use((err, _req, res, next) => {
    if (err === invalidCsrfTokenError) {
      return res.status(403).render("error", { message: "Invalid or missing form token." });
    }
    next(err);
  });

  app.use((err, _req, res, _next) => {
    console.error(err);
    res.status(500).render("error", { message: "Something went wrong." });
  });

  return app;
}
