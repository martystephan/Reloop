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
npm install @reloop-sdk/core
# optional framework bindings
npm install @reloop-sdk/react
npm install @reloop-sdk/vue
```

## 3. Send feedback

```ts
import { createClient } from "@reloop-sdk/core";

const reloop = createClient({
  apiKey: "rl_pub_...",
  endpoint: "https://feedback.example.com", // base URL, not the ingest path
  user: { id: "user_123", email: "marty@example.com" }, // optional
});

await reloop.submit({ type: "bug", message: "The export button 404s" });
```

That's it — each call sends a single HTTP request and resolves on success
or rejects with a `ReloopError` on failure.

Next: pick your integration — [Core](./sdk/core.md),
[React](./sdk/react.md), [Vue](./sdk/vue.md) or
[Plain HTML](./sdk/vanilla.md).
