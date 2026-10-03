import { Router } from "express";
import { requireAuth } from "./auth.js";
import { detail } from "./content.js";
import * as mylist from "./mylist.js";

export const titleRouter = Router();

titleRouter.get("/title/:type/:id", requireAuth, async (req, res, next) => {
  try {
    const { type, id } = req.params;
    const item = await detail(type, id);
    if (!item) return res.status(404).render("error", { message: "Title not found." });
    const inList = (await mylist.keySet(req.session.userId)).has(
      mylist.listKey(item.media_type, item.tmdb_id)
    );
    res.render("title", { title: item.name, item, inList });
  } catch (e) { next(e); }
});
