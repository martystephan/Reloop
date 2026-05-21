import { Router } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { db } from "../db.js";
import { hashApiKey, newId } from "../keys.js";
import { sendViaService, type NotificationServiceRow } from "../mailer.js";

export const ingestRouter = Router();

const feedbackItem = z.object({
  type: z.enum(["bug", "idea", "praise", "rating"]),
  message: z.string().min(1).max(5000),
  rating: z.number().int().min(1).max(5).optional(),
  url: z.string().url().max(2000).optional(),
  meta: z.record(z.unknown()).optional(),
});

const payloadSchema = z.object({
  user: z
    .object({
      id: z.string().max(200).optional(),
      email: z.string().email().optional(),
      name: z.string().max(200).optional(),
    })
    .optional(),
  items: z.array(feedbackItem).min(1).max(50),
});

const limiter = rateLimit({
  windowMs: 60_000,
  limit: 120,
  standardHeaders: true,
  legacyHeaders: false,
});

interface KeyRow {
  id: string;
  project_id: string;
  revoked_at: number | null;
}

ingestRouter.post("/", limiter, (req, res) => {
  const auth = req.header("authorization");
  const raw = auth?.startsWith("Bearer ") ? auth.slice(7) : undefined;
  if (!raw) return res.status(401).json({ error: "missing_api_key" });

  const keyRow = db
    .prepare(
      "SELECT id, project_id, revoked_at FROM api_keys WHERE key_hash = ?",
    )
    .get(hashApiKey(raw)) as KeyRow | undefined;

  if (!keyRow || keyRow.revoked_at !== null) {
    return res.status(401).json({ error: "invalid_api_key" });
  }

  const parsed = payloadSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "invalid_body", issues: parsed.error.issues });
  }

  const userMeta = parsed.data.user
    ? JSON.stringify(parsed.data.user)
    : null;
  const insert = db.prepare(
    `INSERT INTO feedback (id, project_id, type, message, rating, url, user_meta, api_key_id, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  );
  const now = Date.now();
  const tx = db.transaction((items: z.infer<typeof feedbackItem>[]) => {
    for (const it of items) {
      insert.run(
        newId(),
        keyRow.project_id,
        it.type,
        it.message,
        it.rating ?? null,
        it.url ?? null,
        userMeta,
        keyRow.id,
        now,
      );
    }
    db.prepare("UPDATE api_keys SET last_used_at = ? WHERE id = ?").run(
      now,
      keyRow.id,
    );
  });
  tx(parsed.data.items);

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
      sendViaService(svc, projectName, parsed.data.items, parsed.data.user ?? null);
    }
  }

  res.status(202).json({ accepted: parsed.data.items.length });
});
