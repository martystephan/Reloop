import { Router } from "express";
import { z } from "zod";
import { db } from "../db.js";
import { newId } from "../keys.js";
import { requireUser, type AuthedRequest } from "../middleware.js";
import { assertOwnedProject } from "./projects.js";
import type { NotificationServiceRow } from "../mailer.js";

export const notificationServicesRouter = Router();
notificationServicesRouter.use(requireUser);

const MASKED = "***";

function maskService(row: NotificationServiceRow) {
  return { ...row, smtp_pass: MASKED };
}

// ── Global service CRUD ────────────────────────────────────────────────────

notificationServicesRouter.get("/notification-services", (_req, res) => {
  const rows = db
    .prepare("SELECT * FROM notification_services ORDER BY created_at ASC")
    .all() as NotificationServiceRow[];
  res.json({ services: rows.map(maskService) });
});

const serviceSchema = z.object({
  name: z.string().min(1).max(80),
  smtp_host: z.string().min(1).max(200),
  smtp_port: z.number().int().min(1).max(65535),
  smtp_secure: z.boolean(),
  smtp_user: z.string().max(200),
  smtp_pass: z.string().max(500),
  from_address: z.string().email().max(200),
  to_address: z.string().email().max(200),
});

notificationServicesRouter.post("/notification-services", (req, res) => {
  const parsed = serviceSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "invalid_body", issues: parsed.error.issues });
  }
  const { smtp_secure, ...rest } = parsed.data;
  const id = newId();
  db.prepare(
    `INSERT INTO notification_services
     (id, name, type, smtp_host, smtp_port, smtp_secure, smtp_user, smtp_pass, from_address, to_address, created_at)
     VALUES (?, ?, 'email', ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    id,
    rest.name,
    rest.smtp_host,
    rest.smtp_port,
    smtp_secure ? 1 : 0,
    rest.smtp_user,
    rest.smtp_pass,
    rest.from_address,
    rest.to_address,
    Date.now(),
  );
  const row = db
    .prepare("SELECT * FROM notification_services WHERE id = ?")
    .get(id) as NotificationServiceRow;
  res.status(201).json({ service: maskService(row) });
});

const updateSchema = serviceSchema.partial();

notificationServicesRouter.patch("/notification-services/:id", (req, res) => {
  const existing = db
    .prepare("SELECT * FROM notification_services WHERE id = ?")
    .get(req.params.id) as NotificationServiceRow | undefined;
  if (!existing) return res.status(404).json({ error: "not_found" });

  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "invalid_body", issues: parsed.error.issues });
  }

  const d = parsed.data;
  const smtp_pass =
    d.smtp_pass === undefined || d.smtp_pass === MASKED
      ? existing.smtp_pass
      : d.smtp_pass;

  db.prepare(
    `UPDATE notification_services SET
       name = ?, smtp_host = ?, smtp_port = ?, smtp_secure = ?,
       smtp_user = ?, smtp_pass = ?, from_address = ?, to_address = ?
     WHERE id = ?`,
  ).run(
    d.name ?? existing.name,
    d.smtp_host ?? existing.smtp_host,
    d.smtp_port ?? existing.smtp_port,
    d.smtp_secure !== undefined ? (d.smtp_secure ? 1 : 0) : existing.smtp_secure,
    d.smtp_user ?? existing.smtp_user,
    smtp_pass,
    d.from_address ?? existing.from_address,
    d.to_address ?? existing.to_address,
    req.params.id,
  );

  const updated = db
    .prepare("SELECT * FROM notification_services WHERE id = ?")
    .get(req.params.id) as NotificationServiceRow;
  res.json({ service: maskService(updated) });
});

notificationServicesRouter.delete("/notification-services/:id", (req, res) => {
  const existing = db
    .prepare("SELECT id FROM notification_services WHERE id = ?")
    .get(req.params.id);
  if (!existing) return res.status(404).json({ error: "not_found" });
  db.prepare("DELETE FROM notification_services WHERE id = ?").run(req.params.id);
  res.status(204).end();
});

// ── Per-project service links ──────────────────────────────────────────────

notificationServicesRouter.get(
  "/projects/:projectId/notification-services",
  (req: AuthedRequest, res) => {
    try {
      assertOwnedProject(req.params.projectId, req.userId!);
    } catch {
      return res.status(404).json({ error: "not_found" });
    }
    const rows = db
      .prepare(
        `SELECT ns.* FROM notification_services ns
         JOIN project_notification_services pns ON pns.service_id = ns.id
         WHERE pns.project_id = ?
         ORDER BY ns.created_at ASC`,
      )
      .all(req.params.projectId) as NotificationServiceRow[];
    res.json({ services: rows.map(maskService) });
  },
);

const linkSchema = z.object({ serviceIds: z.array(z.string()) });

notificationServicesRouter.put(
  "/projects/:projectId/notification-services",
  (req: AuthedRequest, res) => {
    try {
      assertOwnedProject(req.params.projectId, req.userId!);
    } catch {
      return res.status(404).json({ error: "not_found" });
    }

    const parsed = linkSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "invalid_body", issues: parsed.error.issues });
    }

    const { serviceIds } = parsed.data;

    // Verify all provided IDs exist
    for (const sid of serviceIds) {
      const exists = db
        .prepare("SELECT id FROM notification_services WHERE id = ?")
        .get(sid);
      if (!exists) {
        return res.status(400).json({ error: "service_not_found", serviceId: sid });
      }
    }

    const replace = db.transaction(() => {
      db.prepare(
        "DELETE FROM project_notification_services WHERE project_id = ?",
      ).run(req.params.projectId);
      const insert = db.prepare(
        "INSERT INTO project_notification_services (project_id, service_id) VALUES (?, ?)",
      );
      for (const sid of serviceIds) {
        insert.run(req.params.projectId, sid);
      }
    });
    replace();

    res.status(204).end();
  },
);
