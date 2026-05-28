---
sidebar_position: 4
title: API keys
---

# API keys

Keys authenticate the SDK against your server's ingest endpoint.

- **Publishable.** Keys are prefixed `rl_pub_` and are safe to ship in
  client-side code. They can only *submit* items — never read them.
- **Single type.** Each key is locked to one item type (`bug`, `feedback`,
  `waitlist`, `question` or `other`), chosen at creation. A submission whose `type`
  doesn't match the key is rejected with `403 type_not_allowed`.
- **Shown once.** The raw value is displayed a single time when created.
  The server stores only a SHA-256 hash plus a short prefix for display.
- **Scoped to a project.** Items sent with a key land in that key's project.
- **Revocable.** Revoking is a soft delete: SDKs using the key start
  failing immediately, but historical submissions keep their origin.

## Creating a key

Dashboard → your project → **API Keys** → **Create key**. Pick the item type
the key may send, then copy the value from the dialog right away; you can't
retrieve it later. If you lose it, create a new key and revoke the old one.

Need to collect more than one type? Create one key per type.

## Rotating

1. Create a new key (same type).
2. Deploy it to your app.
3. Revoke the old key once traffic has moved over.
