import { Router } from "express";
import { z } from "zod";
import { db } from "../db.js";
import { requireUser, type AuthedRequest } from "../middleware.js";
import { assertOwnedProject } from "./projects.js";

export const submissionsRouter = Router();
submissionsRouter.use(requireUser);

/** Paginated submissions list for the dashboard. */
submissionsRouter.get(
  "/projects/:projectId/submissions",
  (req: AuthedRequest, res) => {
    try {
      assertOwnedProject(req.params.projectId, req.userId!);
    } catch {
      return res.status(404).json({ error: "not_found" });
    }
    const limit = Math.min(Number(req.query.limit ?? 50), 200);
    const offset = Math.max(Number(req.query.offset ?? 0), 0);
    const type = typeof req.query.type === "string" ? req.query.type : undefined;
    const status =
      typeof req.query.status === "string" ? req.query.status : undefined;
    const keyId =
      typeof req.query.keyId === "string" ? req.query.keyId : undefined;

    const clauses = ["s.project_id = ?"];
    const args: unknown[] = [req.params.projectId];
    if (type) {
      clauses.push("s.type = ?");
      args.push(type);
    }
    if (status) {
      clauses.push("s.status = ?");
      args.push(status);
    }
    if (keyId) {
      clauses.push("s.api_key_id = ?");
      args.push(keyId);
    }
    const where = `WHERE ${clauses.join(" AND ")}`;

    // Screenshots/meta can be large (base64 images), so they're excluded here
    // and loaded on demand via GET /submissions/:id.
    const items = db
      .prepare(
        `SELECT s.id, s.type, s.subject, s.message, s.email,
                (s.screenshot IS NOT NULL) AS has_screenshot,
                s.status, s.created_at, k.name AS api_key_name
         FROM submissions s
         LEFT JOIN api_keys k ON k.id = s.api_key_id
         ${where} ORDER BY s.created_at DESC LIMIT ? OFFSET ?`,
      )
      .all(...args, limit, offset);
    const { total } = db
      .prepare(`SELECT COUNT(*) AS total FROM submissions s ${where}`)
      .get(...args) as { total: number };

    res.json({ items, total, limit, offset });
  },
);

/** Full submission, including screenshot and meta. */
submissionsRouter.get("/submissions/:id", (req: AuthedRequest, res) => {
  const row = db
    .prepare(
      `SELECT s.id, s.type, s.subject, s.message, s.email, s.screenshot, s.meta,
              s.status, s.created_at, k.name AS api_key_name,
              p.owner_user_id AS owner
       FROM submissions s
       JOIN projects p ON p.id = s.project_id
       LEFT JOIN api_keys k ON k.id = s.api_key_id
       WHERE s.id = ?`,
    )
    .get(req.params.id) as
    | (Record<string, unknown> & { owner: string })
    | undefined;
  if (!row || row.owner !== req.userId) {
    return res.status(404).json({ error: "not_found" });
  }
  const { owner, ...submission } = row;
  res.json({ submission });
});

const statusSchema = z.object({
  status: z.enum(["new", "open", "resolved", "archived"]),
});

/** Update a submission's triage status. */
submissionsRouter.patch("/submissions/:id", (req: AuthedRequest, res) => {
  const row = db
    .prepare(
      `SELECT s.id, p.owner_user_id AS owner
       FROM submissions s JOIN projects p ON p.id = s.project_id
       WHERE s.id = ?`,
    )
    .get(req.params.id) as { id: string; owner: string } | undefined;
  if (!row || row.owner !== req.userId) {
    return res.status(404).json({ error: "not_found" });
  }
  const parsed = statusSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "invalid_body", issues: parsed.error.issues });
  }
  db.prepare("UPDATE submissions SET status = ? WHERE id = ?").run(
    parsed.data.status,
    req.params.id,
  );
  res.json({ id: req.params.id, status: parsed.data.status });
});
