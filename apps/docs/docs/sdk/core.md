---
sidebar_position: 1
title: Core
---

# @reloop/core

The framework-agnostic client. React, Vue and the vanilla widget all wrap it.

```bash
npm install @reloop/core
```

## createClient(options)

```ts
import { createClient } from "@reloop/core";

const reloop = createClient({
  apiKey: "rl_pub_...",
  endpoint: "https://feedback.example.com",
  user: { id: "user_123", email: "marty@example.com" },
});
```

### Options

| Option          | Type          | Default | Description                                              |
| --------------- | ------------- | ------- | -------------------------------------------------------- |
| `apiKey`        | `string`      | —       | Publishable key from the dashboard (required).           |
| `endpoint`      | `string`      | —       | **Base URL** of your server. SDK appends `/api/ingest`.  |
| `user`          | `FeedbackUser`| —       | User to attach to feedback. Optional.                    |
| `flushInterval` | `number`      | `3000`  | Auto-flush the queue after this many ms.                 |
| `batchSize`     | `number`      | `10`    | Max items per network request.                           |
| `maxRetries`    | `number`      | `3`     | Send retries per batch before dropping.                  |

## Methods

### submit(feedback)

```ts
reloop.submit({
  type: "bug", // "bug" | "idea" | "praise" | "rating"
  message: "Button funktioniert nicht",
  rating: 3, // optional, typically with type "rating"
  meta: { route: "/inbox", appVersion: "0.1.0" }, // optional
});
```

`url` defaults to `window.location.href` in the browser. Returns a promise
that resolves once the item is queued (not necessarily delivered).

### identify(user)

Associate — or change, e.g. after login — the user for subsequent feedback:

```ts
reloop.identify({ id: "user_123", email: "marty@example.com" });
```

### flush()

Force-send everything currently queued:

```ts
await reloop.flush();
```

## Delivery semantics

Items are batched and flushed on an interval or when `batchSize` is reached.
Failed sends retry with exponential backoff up to `maxRetries`; 4xx
responses (bad key / validation) are dropped without retry. On page unload
the queue is flushed via `navigator.sendBeacon`.
