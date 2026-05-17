import { createHash, randomBytes, randomUUID } from "node:crypto";

const KEY_PREFIX = "rl_pub_";

/** Generates a publishable key. The raw value is shown to the user once. */
export function generateApiKey(): { raw: string; hash: string; prefix: string } {
  const secret = randomBytes(24).toString("base64url");
  const raw = `${KEY_PREFIX}${secret}`;
  return {
    raw,
    hash: hashApiKey(raw),
    // Stored for display, e.g. "rl_pub_8Fk2…"
    prefix: `${raw.slice(0, KEY_PREFIX.length + 4)}…`,
  };
}

export function hashApiKey(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

export const newId = (): string => randomUUID();
