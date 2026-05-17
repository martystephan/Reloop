---
sidebar_position: 4
title: Plain HTML
---

# @reloop/vanilla

A single `<script>` tag, no build step. The widget auto-initialises from
`data-*` attributes on the script element.

```html
<script
  src="https://feedback.example.com/embed/reloop.global.js"
  data-reloop-key="rl_pub_..."
  data-reloop-endpoint="https://feedback.example.com"
  data-reloop-position="bottom-right"
></script>
```

| Attribute               | Required | Description                              |
| ----------------------- | -------- | ---------------------------------------- |
| `data-reloop-key`       | yes      | Publishable API key.                     |
| `data-reloop-endpoint`  | yes      | Base URL of your server.                 |
| `data-reloop-title`     | no       | Panel heading.                           |
| `data-reloop-position`  | no       | `bottom-right` (default) or `bottom-left`|

## Programmatic use

The bundle also exposes a global for manual mounting:

```html
<script src="https://feedback.example.com/embed/reloop.global.js"></script>
<script>
  Reloop.mountWidget({
    apiKey: "rl_pub_...",
    endpoint: "https://feedback.example.com",
  });
</script>
```

When installed from npm (`@reloop/vanilla`) you can also
`import { mountWidget } from "@reloop/vanilla"`.
