---
sidebar_position: 1
title: Core
---

# @reloop-sdk/core

The framework-agnostic client. React, Vue and the vanilla widget all wrap it.

```bash
npm install @reloop-sdk/core
```

## Create a client once, submit anywhere

```ts
// reloop.ts
import { createClient } from "@reloop-sdk/core";

export const reloop = createClient({
  apiKey: "rl_pub_...",
  endpoint: "https://reloop.example.com", // base URL; SDK appends /api/ingest
});
```

### Options

| Option     | Type     | Default | Description                                              |
| ---------- | -------- | ------- | -------------------------------------------------------- |
| `apiKey`   | `string` | —       | Publishable key from the dashboard (required).           |
| `endpoint` | `string` | —       | **Base URL** of your server. SDK appends `/api/ingest`.  |

## submit(item)

`submit` accepts one of five shapes. `meta` is an optional free-form object
on every type; `email` is optional on every type (handy for replies or
mailings); `bug`, `question` and `other` also accept an optional base64
`screenshot`:

```ts
import { reloop } from "./reloop";

// bug — subject + message, optional screenshot/email
await reloop.submit({
  type: "bug",
  subject: "Export button 404s",
  message: "Clicking export on /reports returns a 404.",
  email: "reporter@example.com", // optional
  screenshot: "data:image/png;base64,iVBOR...", // optional
  meta: { route: "/reports", appVersion: "1.2.0" },
});

// feedback — just a message
await reloop.submit({ type: "feedback", message: "Love the new dashboard!" });

// waitlist — an email
await reloop.submit({ type: "waitlist", email: "you@example.com" });

// question — subject + message
await reloop.submit({
  type: "question",
  subject: "Billing",
  message: "Can I switch to annual billing mid-cycle?",
});

// other — escape hatch, every field optional
await reloop.submit({
  type: "other",
  message: "NPS score: 9",
  meta: { campaign: "q3-survey" },
});
```

## Handling errors

`submit()` resolves on success and rejects with a `ReloopError` on failure.
Transient network errors are retried once; HTTP failures carry `status` and
`body`:

```ts
import { reloop, ReloopError } from "@reloop-sdk/core";

try {
  await reloop.submit({ type: "feedback", message: "Hi" });
} catch (err) {
  if (err instanceof ReloopError) {
    console.error(err.status, err.message); // e.g. 401 invalid_api_key
  }
}
```

## A complete example (no framework)

```ts
const form = document.querySelector("form")!;
const status = document.querySelector("#status")!;

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = (form.elements.namedItem("email") as HTMLInputElement).value;
  status.textContent = "Joining…";
  try {
    await reloop.submit({ type: "waitlist", email });
    status.textContent = "You're on the list! 🎉";
  } catch (err) {
    status.textContent = (err as Error).message;
  }
});
```

## Delivery semantics

Each `submit()` sends one HTTP POST and awaits the response. Transient
network errors are retried once; HTTP responses (success or 4xx/5xx) are
returned as-is — non-2xx responses reject with a `ReloopError`. The fetch
uses `keepalive: true` so requests in flight when the page is closing have
a chance to complete.
