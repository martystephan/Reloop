---
sidebar_position: 2
title: Getting started
---

# Getting started

## 1. Create a project and key

In the dashboard, create a project, open it, go to **API Keys** and click
**Create key**. Choose the **item type** the key may send (bug, feedback,
waitlist or question) — a key is locked to that single type. The raw key
(`rl_pub_…`) is shown **once** — copy it then. Only a hash is stored
server-side.

## 2. Install an SDK package

```bash
npm install @reloop-sdk/core
# optional framework bindings
npm install @reloop-sdk/react
npm install @reloop-sdk/vue
```

## 3. Submit an item

```ts
import { createClient } from "@reloop-sdk/core";

const reloop = createClient({
  apiKey: "rl_pub_...",
  endpoint: "https://reloop.example.com", // base URL, not the ingest path
});

await reloop.submit({
  type: "bug",
  subject: "Export button 404s",
  message: "Clicking export on /reports returns a 404.",
});
```

The item's `type` must match the key's type, otherwise the server rejects
it. Each call sends a single HTTP request and resolves on success or rejects
with a `ReloopError` on failure.

Next: pick your integration — [Core](./sdk/core.md),
[React](./sdk/react.md), [Vue](./sdk/vue.md) or
[Plain HTML](./sdk/vanilla.md).
