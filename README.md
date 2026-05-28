# Reloop

Self-hostable SDK and dashboard for bug reports, feedback, waitlist signups
and questions.

```
packages/core      @reloop-sdk/core     framework-agnostic client
packages/react     @reloop-sdk/react    <ReloopProvider>, useSubmit(), <FeedbackWidget>
packages/vue       @reloop-sdk/vue      ReloopPlugin, useSubmit(), <FeedbackWidget>
packages/vanilla   @reloop-sdk/vanilla  script-tag embeddable widget (auto-init)
apps/server        Express + better-sqlite3 + single-admin auth + ingest API
apps/dashboard     React + Vite admin UI (login, projects, API keys, submissions)
apps/docs          Docusaurus SDK documentation site
examples/react-demo  Vite app exercising @reloop-sdk/react end-to-end
```

## Item types

Every submission has a `type` with its own fields. `meta` and `email` are
optional on every type:

| Type        | Fields                                                |
| ----------- | ----------------------------------------------------- |
| `bug`       | `subject`, `message`, `screenshot?`, `email?`, `meta?`|
| `feedback`  | `message`, `email?`, `meta?`                          |
| `waitlist`  | `email`, `meta?`                                      |
| `question`  | `subject`, `message`, `screenshot?`, `email?`, `meta?`|
| `other`     | everything optional — escape hatch                    |

Each API key is locked to a single type. In the dashboard, every submission
carries a triage **status** (new / open / resolved / archived).

## Develop

```bash
pnpm install
pnpm build                       # builds SDK packages first (turbo topo order)

cp apps/server/.env.example apps/server/.env   # then set SESSION_SECRET + ADMIN_PASSWORD
pnpm --filter @reloop-sdk/server dev # http://localhost:8787
pnpm --filter @reloop-sdk/dashboard dev  # http://localhost:5173 (proxies /api)
pnpm --filter @reloop-sdk/docs dev   # http://localhost:3000 (SDK documentation)
pnpm --filter @reloop-sdk/example-react-demo dev
```

The dashboard links to the docs site via `VITE_DOCS_URL` (defaults to
`http://localhost:3000`); set it for production deploys.

The server creates its SQLite tables on boot. There is a single admin
account, configured via `ADMIN_EMAIL` / `ADMIN_PASSWORD`; there is no public
sign-up.

## Self-host

```bash
cp .env.example .env
# edit .env: set SESSION_SECRET (openssl rand -base64 32), ADMIN_PASSWORD,
# and DASHBOARD_ORIGINS=https://feedback.example.com
docker compose up -d --build
```

One container serves both the dashboard and the API on port 8787; SQLite is
persisted in the `reloop-data` volume.

## Using the SDK

1. Sign in to the dashboard, create a project.
2. Open the project → **API Keys** → **Create key**. Pick the item type the
   key may send. The raw key (`rl_pub_…`) is shown **once** with a copy
   button and a ready-to-paste snippet. Only a SHA-256 hash is stored
   server-side.
3. Wire it up:

```ts
import { createClient } from "@reloop-sdk/core";

const reloop = createClient({
  apiKey: "rl_pub_...",
  endpoint: "https://reloop.example.com", // base URL; SDK appends /api/ingest
});
reloop.submit({
  type: "bug",
  subject: "Export button 404s",
  message: "Clicking export on /reports returns a 404.",
});
```

React:

```tsx
import { ReloopProvider, FeedbackWidget } from "@reloop-sdk/react";

<ReloopProvider apiKey="rl_pub_..." endpoint="https://reloop.example.com">
  <App />
  <FeedbackWidget />
</ReloopProvider>;
```

Plain HTML:

```html
<script
  src="https://reloop.example.com/embed/reloop.global.js"
  data-reloop-key="rl_pub_..."
  data-reloop-endpoint="https://reloop.example.com"
></script>
```
