import { createHash, timingSafeEqual } from "node:crypto";
import { Router } from "express";
import { z } from "zod";
import { env } from "../env.js";
import {
  ADMIN_USER_ID,
  clearSessionCookie,
  parseCookies,
  setSessionCookie,
  SESSION_COOKIE,
  verifySessionToken,
} from "../session.js";

export const authRouter = Router();

const loginSchema = z.object({
  email: z.string().min(1),
  password: z.string().min(1),
});

/** Constant-time string compare (hash first so lengths never leak). */
function safeEqual(a: string, b: string): boolean {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

authRouter.post("/auth/login", (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "invalid_body" });
  }
  const okEmail = safeEqual(parsed.data.email.toLowerCase(), env.adminEmail.toLowerCase());
  const okPassword = safeEqual(parsed.data.password, env.adminPassword);
  if (!okEmail || !okPassword) {
    return res.status(401).json({ error: "invalid_credentials" });
  }
  setSessionCookie(res);
  res.json({ user: { id: ADMIN_USER_ID, email: env.adminEmail } });
});

authRouter.post("/auth/logout", (_req, res) => {
  clearSessionCookie(res);
  res.status(204).end();
});

authRouter.get("/auth/session", (req, res) => {
  const token = parseCookies(req.headers.cookie)[SESSION_COOKIE];
  if (!verifySessionToken(token)) {
    return res.status(401).json({ error: "unauthorized" });
  }
  res.json({ user: { id: ADMIN_USER_ID, email: env.adminEmail } });
});
