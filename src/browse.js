import { Router } from "express";
import { requireAuth } from "./auth.js";
import { getTrending, getGenres, getFeatured, getUserList } from "./catalog.js";

export const browseRouter = Router();

browseRouter.get("/browse", requireAuth, async (req, res, next) => {
  try {
    const [featured, trending, genres, myList] = await Promise.all([
      getFeatured(), getTrending(), getGenres(), getUserList(req.session.userId),
    ]);
    const myListIds = new Set(myList.map((t) => t.id));
    res.render("browse", { title: "Browse", featured, trending, genres, myList, myListIds });
  } catch (e) { next(e); }
});
