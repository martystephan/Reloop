---
sidebar_position: 4
title: Plain HTML
---

# @reloop-sdk/vanilla

A single `<script>` tag, no build step — plus a tiny `createClient` for any
item type.

## Feedback widget (script tag)

The widget auto-initialises from `data-*` attributes on the script element
and submits `feedback` items.

```html
<script
  src="https://reloop.example.com/embed/reloop.global.js"
  data-reloop-key="rl_pub_..."
  data-reloop-endpoint="https://reloop.example.com"
  data-reloop-position="bottom-right"
></script>
```

| Attribute               | Required | Description                              |
| ----------------------- | -------- | ---------------------------------------- |
| `data-reloop-key`       | yes      | Publishable API key.                     |
| `data-reloop-endpoint`  | yes      | Base URL of your server.                 |
| `data-reloop-title`     | no       | Panel heading.                           |
| `data-reloop-position`  | no       | `bottom-right` (default) or `bottom-left`|

You can also mount the widget by hand:

```html
<script src="https://reloop.example.com/embed/reloop.global.js"></script>
<script>
  Reloop.mountWidget({
    apiKey: "rl_pub_...",
    endpoint: "https://reloop.example.com",
  });
</script>
```

## Any item type (programmatic)

The bundle exposes `Reloop.createClient` for bugs, waitlist signups and
questions. Here's a waitlist form wired up by hand:

```html
<form id="waitlist">
  <input name="email" type="email" placeholder="you@example.com" required />
  <button>Join waitlist</button>
  <p id="status"></p>
</form>

<script src="https://reloop.example.com/embed/reloop.global.js"></script>
<script>
  const reloop = Reloop.createClient({
    apiKey: "rl_pub_...",
    endpoint: "https://reloop.example.com",
  });

  const form = document.getElementById("waitlist");
  const status = document.getElementById("status");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    status.textContent = "Joining…";
    try {
      await reloop.submit({ type: "waitlist", email: form.email.value });
      status.textContent = "You're on the list! 🎉";
    } catch (err) {
      status.textContent = err.message;
    }
  });
</script>
```

See [Core](./core.md) for every item shape.

## npm

When installed from npm you can import both helpers:

```ts
import { mountWidget, createClient } from "@reloop-sdk/vanilla";
```
