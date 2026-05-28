# @reloop-sdk/vanilla

The embeddable [Reloop](https://martystephan.github.io/Reloop/) feedback widget — a single `<script>` tag, no build step — plus a tiny `createClient` for any item type.

## Feedback widget (script tag, no install)

The widget auto-initialises from `data-*` attributes and submits `feedback`
items, so use it with a key whose type is `feedback`.

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
| `data-reloop-key`       | yes      | Publishable API key (feedback type).     |
| `data-reloop-endpoint`  | yes      | Base URL of your server.                 |
| `data-reloop-title`     | no       | Panel heading.                           |
| `data-reloop-position`  | no       | `bottom-right` (default) or `bottom-left`|

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
    apiKey: "rl_pub_...", // a waitlist-type key
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

## npm

```bash
npm install @reloop-sdk/vanilla
```

```ts
import { mountWidget, createClient } from "@reloop-sdk/vanilla";

// Floating feedback widget…
mountWidget({ apiKey: "rl_pub_...", endpoint: "https://reloop.example.com" });

// …or submit any type yourself
const reloop = createClient({ apiKey: "rl_pub_...", endpoint: "https://reloop.example.com" });
await reloop.submit({ type: "question", subject: "Billing", message: "..." });
```

## Documentation

Full attributes and API: **https://martystephan.github.io/Reloop/sdk/vanilla**

## License

MIT
