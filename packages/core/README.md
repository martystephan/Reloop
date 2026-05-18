# @reloop-sdk/core

Framework-agnostic client for the [Reloop](https://martystephan.github.io/Reloop/) feedback SDK. Handles transport, batching and retries. The React, Vue and vanilla packages all wrap this.

## Install

```bash
npm install @reloop-sdk/core
```

## Usage

```ts
import { createClient } from "@reloop-sdk/core";

const reloop = createClient({
  apiKey: "rl_pub_...",
  endpoint: "https://feedback.example.com",
  user: { id: "user_123", email: "you@example.com" },
});

reloop.submit({
  type: "bug", // "bug" | "idea" | "praise" | "rating"
  message: "The submit button doesn't work",
});
```

- `reloop.identify(user)` — set/change the user after login
- `reloop.flush()` — force-send the queue (returns a promise)

## Documentation

Full options and API: **https://martystephan.github.io/Reloop/sdk/core**

## License

MIT
