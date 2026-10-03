import { Router } from "express";
import { hash, verify } from "@node-rs/argon2";
import { query } from "./db.js";

export const authRouter = Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(email, password) {
  if (!email || !EMAIL_RE.test(email)) return "Please enter a valid email.";
  if (!password || password.length < 8 || password.length > 128)
    return "Password must be 8 to 128 characters.";
  return null;
}

export function requireAuth(req, res, next) {
  if (!req.session.userId) return res.redirect("/login");
  next();
}

authRouter.get("/signup", (req, res) => {
  const email = typeof req.query.email === "string" ? req.query.email : "";
  res.render("signup", { title: "Sign Up", email, error: null });
});

authRouter.post("/signup", async (req, res, next) => {
  try {
    const email = String(req.body.email || "").trim();
    const password = String(req.body.password || "");
    const err = validate(email, password);
    if (err) return res.status(400).render("signup", { title: "Sign Up", email, error: err });

    const password_hash = await hash(password);
    let userId;
    try {
      const r = await query(
        "INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id",
        [email, password_hash]
      );
      userId = r.rows[0].id;
    } catch (e) {
      if (e.code === "23505")
        return res.status(409).render("signup", {
          title: "Sign Up",
          email,
          error: "An account with this email already exists.",
        });
      throw e;
    }

    req.session.regenerate((rerr) => {
      if (rerr) return next(rerr);
      req.session.userId = userId;
      res.redirect("/browse");
    });
  } catch (e) {
    next(e);
  }
});
