---
sidebar_position: 2
title: Getting started
---

# Getting started

## 1. Create a project and key

In the dashboard, create a project, open it, go to **API Keys** and click
**Create key**. The raw key (`rl_pub_…`) is shown **once** — copy it then.
Only a hash is stored server-side.

## 2. Install an SDK package

```bash
npm install @reloop/core
# optional framework bindings
npm install @reloop/react
npm install @reloop/vue
```

## 3. Send feedback

```ts
import { createClient } from "@reloop/core";

const reloop = createClient({
  apiKey: "rl_pub_...",
  endpoint: "https://feedback.example.com", // base URL, not the ingest path
  user: { id: "user_123", email: "marty@example.com" }, // optional
});

reloop.submit({ type: "bug", message: "The export button 404s" });
```

That's it — submissions are queued, batched and retried automatically.

Next: pick your integration — [Core](./sdk/core.md),
[React](./sdk/react.md), [Vue](./sdk/vue.md) or
[Plain HTML](./sdk/vanilla.md).
