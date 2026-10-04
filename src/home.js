import { Router } from "express";
import { browseRows } from "./content.js";

export const homeRouter = Router();

homeRouter.get("/", async (req, res, next) => {
  try {
    if (req.session.userId) return res.redirect("/browse");
    const rows = await browseRows();
    const trending = rows[0]?.items || [];
    res.render("landing", { title: "Netflix", trending, rows });
  } catch (e) { next(e); }
});
