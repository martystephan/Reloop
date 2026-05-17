---
sidebar_position: 4
title: API keys
---

# API keys

Keys authenticate the SDK against your server's ingest endpoint.

- **Publishable.** Keys are prefixed `rl_pub_` and are safe to ship in
  client-side code. They can only *submit* feedback — never read it.
- **Shown once.** The raw value is displayed a single time when created.
  The server stores only a SHA-256 hash plus a short prefix for display.
- **Scoped to a project.** Feedback sent with a key lands in that key's
  project.
- **Revocable.** Revoking is a soft delete: SDKs using the key start
  failing immediately, but historical feedback keeps its origin.

## Creating a key

Dashboard → your project → **API Keys** → **Create key**. Copy the value
from the dialog right away; you can't retrieve it later. If you lose it,
create a new key and revoke the old one.

## Rotating

1. Create a new key.
2. Deploy it to your app.
3. Revoke the old key once traffic has moved over.
