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
      type         TEXT NOT NULL DEFAULT 'feedback',
      key_hash     TEXT NOT NULL UNIQUE,
      prefix       TEXT NOT NULL,
      created_at   INTEGER NOT NULL,
      last_used_at INTEGER,
      revoked_at   INTEGER
    );
    CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON api_keys(key_hash);

    CREATE TABLE IF NOT EXISTS submissions (
      id         TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      type       TEXT NOT NULL,
      subject    TEXT,
      message    TEXT,
      email      TEXT,
      screenshot TEXT,
      meta       TEXT,
      status     TEXT NOT NULL DEFAULT 'new',
      api_key_id TEXT,
      created_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_submissions_project ON submissions(project_id, created_at DESC);
  `);

  // Added after a key could only carry a single submission type.
  const hasKeyType = db
    .prepare("SELECT 1 FROM pragma_table_info('api_keys') WHERE name = ?")
    .get("type");
  if (!hasKeyType) {
    db.exec("ALTER TABLE api_keys ADD COLUMN type TEXT NOT NULL DEFAULT 'feedback'");
  }

  const submissionCols = db
    .prepare("SELECT name FROM pragma_table_info('submissions')")
    .all() as { name: string }[];
  const hasCol = (name: string) => submissionCols.some((c) => c.name === name);

  // `image` was renamed to `screenshot`.
  if (hasCol("image") && !hasCol("screenshot")) {
    db.exec("ALTER TABLE submissions RENAME COLUMN image TO screenshot");
  }
  // Dashboard-managed triage state.
  if (!hasCol("status")) {
    db.exec("ALTER TABLE submissions ADD COLUMN status TEXT NOT NULL DEFAULT 'new'");
  }

  db.exec(`
    CREATE TABLE IF NOT EXISTS notification_services (
      id                 TEXT PRIMARY KEY,
      name               TEXT NOT NULL,
      type               TEXT NOT NULL DEFAULT 'email',
      smtp_host          TEXT NOT NULL,
      smtp_port          INTEGER NOT NULL,
      smtp_secure        INTEGER NOT NULL DEFAULT 0,
      smtp_user          TEXT NOT NULL,
      smtp_pass          TEXT NOT NULL,
      from_address       TEXT NOT NULL,
      to_address         TEXT NOT NULL,
      include_subject    INTEGER NOT NULL DEFAULT 1,
      include_message    INTEGER NOT NULL DEFAULT 1,
      include_email      INTEGER NOT NULL DEFAULT 1,
      include_meta       INTEGER NOT NULL DEFAULT 0,
      include_screenshot INTEGER NOT NULL DEFAULT 0,
      created_at         INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS project_notification_services (
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      service_id TEXT NOT NULL REFERENCES notification_services(id) ON DELETE CASCADE,
      PRIMARY KEY (project_id, service_id)
    );
  `);

  // Configurable notification content, added after services were SMTP-only.
  const serviceCols = db
    .prepare("SELECT name FROM pragma_table_info('notification_services')")
    .all() as { name: string }[];
  const addServiceCol = (name: string, def: 0 | 1) => {
    if (!serviceCols.some((c) => c.name === name)) {
      db.exec(
        `ALTER TABLE notification_services ADD COLUMN ${name} INTEGER NOT NULL DEFAULT ${def}`,
      );
    }
  };
  addServiceCol("include_subject", 1);
  addServiceCol("include_message", 1);
  addServiceCol("include_email", 1);
  addServiceCol("include_meta", 0);
  addServiceCol("include_screenshot", 0);
}
