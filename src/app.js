import express from "express";
import helmet from "helmet";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

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
  app.use(express.static(join(dir, "..", "public")));

  app.get("/healthz", (_req, res) => res.type("text").send("ok"));

  // Routers mounted here in later tasks.

  app.use((err, _req, res, _next) => {
    console.error(err);
    res.status(500).render("error", { message: "Something went wrong." });
  });

  return app;
}
