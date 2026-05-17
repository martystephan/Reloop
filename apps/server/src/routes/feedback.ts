import { Router } from "express";
import { db } from "../db.js";
import { requireUser, type AuthedRequest } from "../middleware.js";
import { assertOwnedProject } from "./projects.js";

export const feedbackRouter = Router();
feedbackRouter.use(requireUser);

/** Paginated feedback list for the dashboard. */
feedbackRouter.get("/projects/:projectId/feedback", (req: AuthedRequest, res) => {
  try {
    assertOwnedProject(req.params.projectId, req.userId!);
  } catch {
    return res.status(404).json({ error: "not_found" });
  }
  const limit = Math.min(Number(req.query.limit ?? 50), 200);
  const offset = Math.max(Number(req.query.offset ?? 0), 0);
  const type = typeof req.query.type === "string" ? req.query.type : undefined;

  const where = type
    ? "WHERE f.project_id = ? AND f.type = ?"
    : "WHERE f.project_id = ?";
  const args = type
    ? [req.params.projectId, type]
    : [req.params.projectId];

  const items = db
    .prepare(
      `SELECT f.id, f.type, f.message, f.rating, f.url, f.user_meta,
              f.created_at, k.name AS api_key_name
       FROM feedback f
       LEFT JOIN api_keys k ON k.id = f.api_key_id
       ${where} ORDER BY f.created_at DESC LIMIT ? OFFSET ?`,
    )
    .all(...args, limit, offset);
  const { total } = db
    .prepare(`SELECT COUNT(*) AS total FROM feedback f ${where}`)
    .get(...args) as { total: number };

  res.json({ items, total, limit, offset });
});
