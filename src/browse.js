import { Router } from "express";
import { requireAuth } from "./auth.js";
import { browseRows } from "./content.js";
import * as mylist from "./mylist.js";

export const browseRouter = Router();

browseRouter.get("/browse", requireAuth, async (req, res, next) => {
  try {
    const [rows, myItems] = await Promise.all([
      browseRows(),
      mylist.listFor(req.session.userId),
    ]);
    const inList = new Set(myItems.map((x) => mylist.listKey(x.media_type, x.tmdb_id)));
    const featured = rows[0]?.items?.[0] || null;
    res.render("browse", { title: "Browse", featured, rows, myItems, inList });
  } catch (e) { next(e); }
});

browseRouter.post("/my-list", requireAuth, async (req, res, next) => {
  try {
    await mylist.add(req.session.userId, {
      media_type: String(req.body.media_type || ""),
      tmdb_id: String(req.body.tmdb_id || ""),
      name: String(req.body.name || ""),
      poster_url: String(req.body.poster_url || ""),
    });
    res.redirect(req.body.back || "/browse");
  } catch (e) { next(e); }
});

browseRouter.post("/my-list/remove", requireAuth, async (req, res, next) => {
  try {
    await mylist.remove(
      req.session.userId,
      String(req.body.media_type || ""),
      String(req.body.tmdb_id || "")
    );
    res.redirect(req.body.back || "/browse");
  } catch (e) { next(e); }
});
