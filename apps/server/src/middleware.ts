import type { NextFunction, Request, Response } from "express";
import {
  ADMIN_USER_ID,
  parseCookies,
  SESSION_COOKIE,
  verifySessionToken,
} from "./session.js";

export interface AuthedRequest extends Request {
  userId?: string;
}

/** Requires a valid admin session cookie; attaches the admin userId. */
export function requireUser(
  req: AuthedRequest,
  res: Response,
  next: NextFunction,
) {
  const token = parseCookies(req.headers.cookie)[SESSION_COOKIE];
  if (!verifySessionToken(token)) {
    return res.status(401).json({ error: "unauthorized" });
  }
  req.userId = ADMIN_USER_ID;
  next();
}
