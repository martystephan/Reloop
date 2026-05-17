import "dotenv/config";

export const env = {
  port: Number(process.env.PORT ?? 8787),
  databasePath: process.env.DATABASE_PATH ?? "./reloop.db",
  /** Secret used to sign the admin session cookie. */
  sessionSecret: process.env.SESSION_SECRET ?? "dev-insecure-secret-change-me",
  /** The single admin account's credentials. */
  adminEmail: process.env.ADMIN_EMAIL ?? "admin@example.com",
  adminPassword: process.env.ADMIN_PASSWORD ?? "admin",
  /** Comma-separated list of origins allowed to call the dashboard API. */
  dashboardOrigins: (process.env.DASHBOARD_ORIGINS ?? "http://localhost:5173")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
  nodeEnv: process.env.NODE_ENV ?? "development",
};

if (env.nodeEnv === "production") {
  if (env.sessionSecret === "dev-insecure-secret-change-me") {
    throw new Error("SESSION_SECRET must be set in production");
  }
  if (env.adminPassword === "admin") {
    throw new Error("ADMIN_PASSWORD must be set in production");
  }
}
