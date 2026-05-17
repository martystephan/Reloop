import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { env } from "./env.js";
import { migrate } from "./db.js";
import { authRouter } from "./routes/auth.js";
import { ingestRouter } from "./routes/ingest.js";
import { projectsRouter } from "./routes/projects.js";
import { keysRouter } from "./routes/keys.js";
import { feedbackRouter } from "./routes/feedback.js";

const app = express();
app.disable("x-powered-by");
app.use(helmet({ contentSecurityPolicy: false }));

// SDK ingestion: open CORS (called from arbitrary customer sites).
app.use("/api/ingest", cors(), express.json({ limit: "256kb" }));
app.use("/api/ingest", ingestRouter);

// Dashboard API: locked to known dashboard origins, cookies allowed.
const dashboardCors = cors({ origin: env.dashboardOrigins, credentials: true });
app.use("/api", dashboardCors, express.json({ limit: "256kb" }));

// Public health check — must be registered before the auth-protected routers.
app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.use("/api", authRouter);
app.use("/api/projects", projectsRouter);
app.use("/api", keysRouter);
app.use("/api", feedbackRouter);

// In production, serve the built dashboard from the same origin.
if (env.nodeEnv === "production") {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const staticDir = path.resolve(here, "../public");
  app.use(express.static(staticDir));
  app.get("*", (_req, res) => res.sendFile(path.join(staticDir, "index.html")));
}

async function start() {
  migrate();
  app.listen(env.port, () => {
    console.log(`reloop server listening on http://localhost:${env.port}`);
  });
}

start().catch((err) => {
  console.error("[reloop] failed to start:", err);
  process.exit(1);
});
