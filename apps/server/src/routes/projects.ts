import { Router } from "express";
import { z } from "zod";
import { db } from "../db.js";
import { newId } from "../keys.js";
import { requireUser, type AuthedRequest } from "../middleware.js";

export const projectsRouter = Router();
projectsRouter.use(requireUser);

interface ProjectRow {
  id: string;
  name: string;
  owner_user_id: string;
  created_at: number;
}

/** Throws (via res) if the project is not owned by the requesting user. */
export function assertOwnedProject(projectId: string, userId: string): ProjectRow {
  const row = db
    .prepare("SELECT * FROM projects WHERE id = ?")
    .get(projectId) as ProjectRow | undefined;
  if (!row || row.owner_user_id !== userId) {
    throw new Error("not_found");
  }
  return row;
}

projectsRouter.get("/", (req: AuthedRequest, res) => {
  const rows = db
    .prepare(
      `SELECT p.id, p.name, p.created_at,
              (SELECT COUNT(*) FROM submissions s WHERE s.project_id = p.id) AS submission_count,
              (SELECT COUNT(*) FROM project_notification_services pns WHERE pns.project_id = p.id) AS notification_service_count
       FROM projects p
       WHERE p.owner_user_id = ?
       ORDER BY p.created_at DESC`,
    )
    .all(req.userId);
  res.json({ projects: rows });
});

const createSchema = z.object({ name: z.string().min(1).max(80) });

projectsRouter.post("/", (req: AuthedRequest, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "invalid_body", issues: parsed.error.issues });
  }
  const id = newId();
  db.prepare(
    "INSERT INTO projects (id, name, owner_user_id, created_at) VALUES (?, ?, ?, ?)",
  ).run(id, parsed.data.name, req.userId, Date.now());
  res.status(201).json({ project: { id, name: parsed.data.name } });
});

const updateSchema = z.object({ name: z.string().min(1).max(80) });

projectsRouter.patch("/:id", (req: AuthedRequest, res) => {
  try {
    assertOwnedProject(req.params.id, req.userId!);
  } catch {
    return res.status(404).json({ error: "not_found" });
  }
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "invalid_body", issues: parsed.error.issues });
  }
  db.prepare("UPDATE projects SET name = ? WHERE id = ?").run(
    parsed.data.name,
    req.params.id,
  );
  res.json({ project: { id: req.params.id, name: parsed.data.name } });
});

projectsRouter.delete("/:id", (req: AuthedRequest, res) => {
  try {
    assertOwnedProject(req.params.id, req.userId!);
  } catch {
    return res.status(404).json({ error: "not_found" });
  }
  db.prepare("DELETE FROM projects WHERE id = ?").run(req.params.id);
  res.status(204).end();
});
