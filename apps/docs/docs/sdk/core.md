---
sidebar_position: 1
title: Core
---

# @reloop-sdk/core

The framework-agnostic client. React, Vue and the vanilla widget all wrap it.

```bash
npm install @reloop-sdk/core
```

## createClient(options)

```ts
import { createClient } from "@reloop-sdk/core";

const reloop = createClient({
  apiKey: "rl_pub_...",
  endpoint: "https://feedback.example.com",
  user: { id: "user_123", email: "marty@example.com" },
});
```

### Options

| Option     | Type          | Default | Description                                              |
| ---------- | ------------- | ------- | -------------------------------------------------------- |
| `apiKey`   | `string`      | —       | Publishable key from the dashboard (required).           |
| `endpoint` | `string`      | —       | **Base URL** of your server. SDK appends `/api/ingest`.  |
| `user`     | `FeedbackUser`| —       | User to attach to feedback. Optional.                    |

## Methods

### submit(feedback)

```ts
await reloop.submit({
  type: "bug", // "bug" | "idea" | "praise" | "rating"
  message: "Button funktioniert nicht",
  rating: 3, // optional, typically with type "rating"
  meta: { route: "/inbox", appVersion: "0.1.0" }, // optional
});
```

`url` defaults to `window.location.href` in the browser. Returns a promise
that resolves once the feedback is delivered, or rejects with a
`ReloopError` (with `status` and `body` for HTTP failures) if delivery
fails.

### identify(user)

Associate — or change, e.g. after login — the user for subsequent feedback:

```ts
reloop.identify({ id: "user_123", email: "marty@example.com" });
```

## Delivery semantics

Each `submit()` sends one HTTP POST and awaits the response. Transient
network errors are retried once; HTTP responses (success or 4xx/5xx) are
returned as-is — non-2xx responses reject with a `ReloopError`. The fetch
uses `keepalive: true` so requests in flight when the page is closing have
a chance to complete.
