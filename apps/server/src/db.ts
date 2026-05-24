import Database from "better-sqlite3";
import { env } from "./env.js";

export const db = new Database(env.databasePath);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

/**
 * Creates the application tables. Idempotent — safe to run on every boot.
 * Better Auth manages its own tables (user, session, account, verification)
 * via its built-in better-sqlite3 support, so we only own these three.
 */
export function migrate(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id            TEXT PRIMARY KEY,
      name          TEXT NOT NULL,
      owner_user_id TEXT NOT NULL,
      created_at    INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS api_keys (
      id           TEXT PRIMARY KEY,
      project_id   TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      name         TEXT NOT NULL,
      key_hash     TEXT NOT NULL UNIQUE,
      prefix       TEXT NOT NULL,
      created_at   INTEGER NOT NULL,
      last_used_at INTEGER,
      revoked_at   INTEGER
    );
    CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON api_keys(key_hash);

    CREATE TABLE IF NOT EXISTS feedback (
      id         TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      type       TEXT NOT NULL,
      message    TEXT NOT NULL,
      rating     INTEGER,
      url        TEXT,
      user_meta  TEXT,
      created_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_feedback_project ON feedback(project_id, created_at DESC);
  `);

  // Added after initial release: track which API key submitted each item.
  const hasApiKeyId = db
    .prepare("SELECT 1 FROM pragma_table_info('feedback') WHERE name = ?")
    .get("api_key_id");
  if (!hasApiKeyId) {
    db.exec("ALTER TABLE feedback ADD COLUMN api_key_id TEXT");
  }

  const hasFeedbackMeta = db
    .prepare("SELECT 1 FROM pragma_table_info('feedback') WHERE name = ?")
    .get("feedback_meta");
  if (!hasFeedbackMeta) {
    db.exec("ALTER TABLE feedback ADD COLUMN feedback_meta TEXT");
  }

  db.exec(`
    CREATE TABLE IF NOT EXISTS notification_services (
      id           TEXT PRIMARY KEY,
      name         TEXT NOT NULL,
      type         TEXT NOT NULL DEFAULT 'email',
      smtp_host    TEXT NOT NULL,
      smtp_port    INTEGER NOT NULL,
      smtp_secure  INTEGER NOT NULL DEFAULT 0,
      smtp_user    TEXT NOT NULL,
      smtp_pass    TEXT NOT NULL,
      from_address TEXT NOT NULL,
      to_address   TEXT NOT NULL,
      created_at   INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS project_notification_services (
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      service_id TEXT NOT NULL REFERENCES notification_services(id) ON DELETE CASCADE,
      PRIMARY KEY (project_id, service_id)
    );
  `);
}
