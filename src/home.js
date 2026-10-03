import { Router } from "express";
import { getTrending } from "./catalog.js";

export const homeRouter = Router();

homeRouter.get("/", async (req, res, next) => {
  try {
    if (req.session.userId) return res.redirect("/browse");
    const trending = await getTrending();
    res.render("landing", { title: "Netflix", trending });
  } catch (e) { next(e); }
});
