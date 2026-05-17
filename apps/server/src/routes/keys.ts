import { Router } from "express";
import { z } from "zod";
import { db } from "../db.js";
import { generateApiKey, newId } from "../keys.js";
import { requireUser, type AuthedRequest } from "../middleware.js";
import { assertOwnedProject } from "./projects.js";

export const keysRouter = Router();
keysRouter.use(requireUser);

const createSchema = z.object({ name: z.string().min(1).max(80) });

/** List keys for a project (never returns the raw secret). */
keysRouter.get("/projects/:projectId/keys", (req: AuthedRequest, res) => {
  try {
    assertOwnedProject(req.params.projectId, req.userId!);
  } catch {
    return res.status(404).json({ error: "not_found" });
  }
  const rows = db
    .prepare(
      `SELECT id, name, prefix, created_at, last_used_at, revoked_at
       FROM api_keys WHERE project_id = ? ORDER BY created_at DESC`,
    )
    .all(req.params.projectId);
  res.json({ keys: rows });
});

/** Create a key. The raw value is returned exactly once, here. */
keysRouter.post("/projects/:projectId/keys", (req: AuthedRequest, res) => {
  try {
    assertOwnedProject(req.params.projectId, req.userId!);
  } catch {
    return res.status(404).json({ error: "not_found" });
  }
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "invalid_body", issues: parsed.error.issues });
  }
  const { raw, hash, prefix } = generateApiKey();
  const id = newId();
  db.prepare(
    `INSERT INTO api_keys (id, project_id, name, key_hash, prefix, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
  ).run(id, req.params.projectId, parsed.data.name, hash, prefix, Date.now());

  res.status(201).json({
    key: { id, name: parsed.data.name, prefix },
    // Surfaced once — the dashboard shows this in a copy-me-now modal.
    secret: raw,
  });
});

/** Revoke a key (soft delete so historical feedback keeps its origin). */
keysRouter.delete("/keys/:id", (req: AuthedRequest, res) => {
  const row = db
    .prepare(
      `SELECT k.id, p.owner_user_id AS owner
       FROM api_keys k JOIN projects p ON p.id = k.project_id
       WHERE k.id = ?`,
    )
    .get(req.params.id) as { id: string; owner: string } | undefined;
  if (!row || row.owner !== req.userId) {
    return res.status(404).json({ error: "not_found" });
  }
  db.prepare("UPDATE api_keys SET revoked_at = ? WHERE id = ?").run(
    Date.now(),
    req.params.id,
  );
  res.status(204).end();
});
