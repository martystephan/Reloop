---
slug: /
sidebar_position: 1
title: Introduction
---

# Reloop

Reloop is a self-hostable feedback SDK and dashboard. Drop a small client
into your app, let users send bugs, ideas, praise and ratings, and read it
all back in a dashboard you run yourself.

## Packages

| Package           | What it is                                              |
| ----------------- | ------------------------------------------------------- |
| `@reloop/core`    | Framework-agnostic client (batching, retry, beacon)     |
| `@reloop/react`   | `ReloopProvider`, `useFeedback()`, `<FeedbackWidget />`  |
| `@reloop/vue`     | `ReloopPlugin`, `useFeedback()`, `FeedbackWidget`        |
| `@reloop/vanilla` | Script-tag embeddable widget with auto-init             |

## How it fits together

1. Run the **server** (Express + SQLite) and **dashboard** (React + Vite).
2. Sign in, create a project, generate an **API key**.
3. Install an SDK package, point it at your server `endpoint`, and `submit()`.

The `endpoint` is always the **base URL** of your server — the SDK appends
the ingest path itself.

Continue with [Getting started](./getting-started.md).
