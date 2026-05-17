import { createHmac, timingSafeEqual } from "node:crypto";
import type { Response } from "express";
import { env } from "./env.js";

/**
 * Minimal single-user session. There is exactly one account (the admin), so a
 * session token just needs to prove "the admin logged in and it hasn't
 * expired". The token is `<expiresAt>.<hmac>`, signed with SESSION_SECRET so it
 * can't be forged by editing the cookie.
 */

export const SESSION_COOKIE = "reloop_session";
export const ADMIN_USER_ID = "admin";

const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function sign(payload: string): string {
  return createHmac("sha256", env.sessionSecret).update(payload).digest("hex");
}

export function createSessionToken(): string {
  const expiresAt = String(Date.now() + MAX_AGE_MS);
  return `${expiresAt}.${sign(expiresAt)}`;
}

export function verifySessionToken(token: string | undefined): boolean {
  if (!token) return false;
  const dot = token.lastIndexOf(".");
  if (dot < 0) return false;
  const expiresAt = token.slice(0, dot);
  const mac = token.slice(dot + 1);
  const expected = sign(expiresAt);
  // Constant-time compare; lengths must match for timingSafeEqual.
  if (mac.length !== expected.length) return false;
  if (!timingSafeEqual(Buffer.from(mac), Buffer.from(expected))) return false;
  return Number(expiresAt) > Date.now();
}

/** Parses the raw Cookie header into a name→value map. */
export function parseCookies(header: string | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  if (!header) return out;
  for (const part of header.split(";")) {
    const eq = part.indexOf("=");
    if (eq < 0) continue;
    out[part.slice(0, eq).trim()] = decodeURIComponent(part.slice(eq + 1).trim());
  }
  return out;
}

export function setSessionCookie(res: Response): void {
  res.cookie(SESSION_COOKIE, createSessionToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: env.nodeEnv === "production",
    maxAge: MAX_AGE_MS,
    path: "/",
  });
}

export function clearSessionCookie(res: Response): void {
  res.clearCookie(SESSION_COOKIE, { path: "/" });
}
