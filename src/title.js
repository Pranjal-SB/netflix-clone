import { Router } from "express";
import { detail } from "./content.js";
import * as mylist from "./mylist.js";

export const titleRouter = Router();

titleRouter.get("/title/:type/:id", async (req, res, next) => {
  try {
    const { type, id } = req.params;
    const item = await detail(type, id);
    if (!item) return res.status(404).render("error", { message: "Title not found." });
    const userId = req.session?.userId || null;
    const inList = userId
      ? (await mylist.keySet(userId)).has(mylist.listKey(item.media_type, item.tmdb_id))
      : false;
    res.render("title", { title: item.name, item, inList, userId });
  } catch (e) { next(e); }
});
