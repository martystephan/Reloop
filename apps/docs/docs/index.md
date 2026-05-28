---
slug: /
sidebar_position: 1
title: Introduction
---

# Reloop

Reloop is a self-hostable SDK and dashboard for collecting **bug reports,
feedback, waitlist signups and questions**. Drop a small client into your
app, send items, and read them all back in a dashboard you run yourself.

## Packages

| Package           | What it is                                              |
| ----------------- | ------------------------------------------------------- |
| `@reloop-sdk/core`    | Framework-agnostic client (`createClient`, `submit`)    |
| `@reloop-sdk/react`   | `ReloopProvider`, `useSubmit()`, `<FeedbackWidget />`   |
| `@reloop-sdk/vue`     | `ReloopPlugin`, `useSubmit()`, `FeedbackWidget`         |
| `@reloop-sdk/vanilla` | Script-tag embeddable widget with auto-init             |

## Item types

Every submission has a `type`, and each carries its own fields:

| Type        | Fields                                                |
| ----------- | ----------------------------------------------------- |
| `bug`       | `subject`, `message`, `screenshot?`, `email?`, `meta?`|
| `feedback`  | `message`, `email?`, `meta?`                          |
| `waitlist`  | `email`, `meta?`                                      |
| `question`  | `subject`, `message`, `screenshot?`, `email?`, `meta?`|
| `other`     | everything optional — escape hatch                    |

`meta` and `email` are optional on every type. In the dashboard, each
submission also carries a triage **status** (new / open / resolved /
archived) that you manage there.

## How it fits together

1. Run the **server** (Express + SQLite) and **dashboard** (React + Vite).
2. Sign in, create a project, generate an **API key** — each key is locked
   to a single item type.
3. Install an SDK package, point it at your server `endpoint`, and `submit()`.

The `endpoint` is always the **base URL** of your server — the SDK appends
the ingest path itself.

Continue with [Getting started](./getting-started.md).
