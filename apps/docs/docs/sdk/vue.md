---
sidebar_position: 3
title: Vue
---

# @reloop/vue

```bash
npm install @reloop/core @reloop/vue
```

## Plugin

```ts
import { createApp } from "vue";
import { ReloopPlugin, FeedbackWidget } from "@reloop/vue";
import App from "./App.vue";

const app = createApp(App);
app.use(ReloopPlugin, {
  apiKey: "rl_pub_...",
  endpoint: "https://feedback.example.com",
});
app.component("FeedbackWidget", FeedbackWidget);
app.mount("#app");
```

You can also pass a pre-built `client` instead of options.

## useFeedback()

```vue
<script setup lang="ts">
import { useFeedback } from "@reloop/vue";

const { submit, status, error } = useFeedback();
</script>

<template>
  <button :disabled="status === 'submitting'"
          @click="submit({ type: 'idea', message: 'Add dark mode' })">
    {{ status === "submitting" ? "Sending…" : "Send idea" }}
  </button>
</template>
```

## useReloop()

Returns the underlying [`@reloop/core`](./core.md) client, e.g. for
`identify()`:

```ts
import { useReloop } from "@reloop/vue";

const reloop = useReloop();
reloop.identify({ id: user.id, email: user.email });
```

## FeedbackWidget

Drop-in floating widget. Props: `title` (string),
`position` (`"bottom-right" | "bottom-left"`).
