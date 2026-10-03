import { Router } from "express";
import { requireAuth } from "./auth.js";
import { query } from "./db.js";
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

browseRouter.post("/my-list", requireAuth, async (req, res, next) => {
  try {
    const titleId = Number(req.body.title_id);
    if (!Number.isInteger(titleId)) return res.redirect("/browse");
    await query(
      "INSERT INTO my_list (user_id, title_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
      [req.session.userId, titleId]
    );
    res.redirect("/browse");
  } catch (e) { next(e); }
});

browseRouter.post("/my-list/:titleId/delete", requireAuth, async (req, res, next) => {
  try {
    const titleId = Number(req.params.titleId);
    if (Number.isInteger(titleId)) {
      await query("DELETE FROM my_list WHERE user_id = $1 AND title_id = $2", [
        req.session.userId, titleId,
      ]);
    }
    res.redirect("/browse");
  } catch (e) { next(e); }
});
