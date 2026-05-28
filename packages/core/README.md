# @reloop-sdk/core

Framework-agnostic client for the [Reloop](https://martystephan.github.io/Reloop/) SDK — collect bug reports, feedback, waitlist signups and questions. The React, Vue and vanilla packages all wrap this.

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

Each API key is locked to a single item type, so the item's `type` must
match the key. `submit` accepts one of four shapes — `meta` is an optional
free-form object on every type:

`email` is optional on every type (handy for replies or mailings); `bug`,
`question` and `other` also accept an optional base64 `screenshot`.

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
    console.error(err.status, err.message); // e.g. 403 type_not_allowed
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

## Documentation

Full options and API: **https://martystephan.github.io/Reloop/sdk/core**

## License

MIT
