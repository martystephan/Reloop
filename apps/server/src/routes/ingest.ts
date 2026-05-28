import { Router } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { db } from "../db.js";
import { hashApiKey, newId } from "../keys.js";
import { sendViaService, type NotificationServiceRow } from "../mailer.js";

export const ingestRouter = Router();

const meta = z.record(z.unknown()).optional();
const subject = z.string().min(1).max(200);
const message = z.string().min(1).max(5000);
const email = z.string().email().max(320);
// Base64 data URL of a screenshot; capped to keep payloads sane.
const screenshot = z.string().max(1_500_000).optional();

const itemSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("bug"),
    subject,
    message,
    email: email.optional(),
    screenshot,
    meta,
  }),
  z.object({
    type: z.literal("feedback"),
    message,
    email: email.optional(),
    meta,
  }),
  z.object({
    type: z.literal("waitlist"),
    email,
    meta,
  }),
  z.object({
    type: z.literal("question"),
    subject,
    message,
    email: email.optional(),
    screenshot,
    meta,
  }),
  z.object({
    type: z.literal("other"),
    subject: subject.optional(),
    message: message.optional(),
    email: email.optional(),
    screenshot,
    meta,
  }),
]);

const limiter = rateLimit({
  windowMs: 60_000,
  limit: 120,
  standardHeaders: true,
  legacyHeaders: false,
});

interface KeyRow {
  id: string;
  project_id: string;
  type: string;
  revoked_at: number | null;
}

ingestRouter.post("/", limiter, (req, res) => {
  const auth = req.header("authorization");
  const raw = auth?.startsWith("Bearer ") ? auth.slice(7) : undefined;
  if (!raw) return res.status(401).json({ error: "missing_api_key" });

  const keyRow = db
    .prepare(
      "SELECT id, project_id, type, revoked_at FROM api_keys WHERE key_hash = ?",
    )
    .get(hashApiKey(raw)) as KeyRow | undefined;

  if (!keyRow || keyRow.revoked_at !== null) {
    return res.status(401).json({ error: "invalid_api_key" });
  }

  const parsed = itemSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "invalid_body", issues: parsed.error.issues });
  }

  const item = parsed.data;
  if (item.type !== keyRow.type) {
    return res.status(403).json({
      error: "type_not_allowed",
      allowed: keyRow.type,
    });
  }

  const subject = "subject" in item ? (item.subject ?? null) : null;
  const message = "message" in item ? (item.message ?? null) : null;
  const email = "email" in item ? (item.email ?? null) : null;
  const screenshot = "screenshot" in item ? (item.screenshot ?? null) : null;

  const now = Date.now();
  const tx = db.transaction(() => {
    db.prepare(
      `INSERT INTO submissions (id, project_id, type, subject, message, email, screenshot, meta, api_key_id, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      newId(),
      keyRow.project_id,
      item.type,
      subject,
      message,
      email,
      screenshot,
      item.meta ? JSON.stringify(item.meta) : null,
      keyRow.id,
      now,
    );
    db.prepare("UPDATE api_keys SET last_used_at = ? WHERE id = ?").run(
      now,
      keyRow.id,
    );
  });
  tx();

  // Fire email notifications asynchronously — never block the response.
  const linkedServices = db
    .prepare(
      `SELECT ns.* FROM notification_services ns
       JOIN project_notification_services pns ON pns.service_id = ns.id
       WHERE pns.project_id = ?`,
    )
    .all(keyRow.project_id) as NotificationServiceRow[];

  if (linkedServices.length > 0) {
    const project = db
      .prepare("SELECT name FROM projects WHERE id = ?")
      .get(keyRow.project_id) as { name: string } | undefined;
    const projectName = project?.name ?? keyRow.project_id;
    for (const svc of linkedServices) {
      sendViaService(svc, projectName, item);
    }
  }

  res.status(202).json({ accepted: 1 });
});
