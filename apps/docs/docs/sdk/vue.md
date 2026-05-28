---
sidebar_position: 3
title: Vue
---

# @reloop-sdk/vue

A plugin, a `useSubmit()` composable, and a drop-in `FeedbackWidget`.

```bash
npm install @reloop-sdk/core @reloop-sdk/vue
```

## 1. Register the plugin

Install the client once. Each API key is locked to a single item type
(`bug`, `feedback`, `waitlist`, `question` or `other`).

```ts
import { createApp } from "vue";
import { ReloopPlugin } from "@reloop-sdk/vue";
import App from "./App.vue";

createApp(App)
  .use(ReloopPlugin, {
    apiKey: "rl_pub_...",
    endpoint: "https://reloop.example.com",
  })
  .mount("#app");
```

You can also pass a pre-built `client` instead of `apiKey`/`endpoint`.

## 2. Use the composable

`useSubmit()` returns `{ submit, reset, status, error }` (`status` and
`error` are refs). `status` is `"idle" | "submitting" | "success" | "error"`.

### Waitlist form

```vue
<script setup lang="ts">
import { ref } from "vue";
import { useSubmit } from "@reloop-sdk/vue";

const { submit, status, error } = useSubmit();
const email = ref("");

async function onSubmit() {
  await submit({ type: "waitlist", email: email.value });
}
</script>

<template>
  <p v-if="status === 'success'">You're on the list! 🎉</p>
  <form v-else @submit.prevent="onSubmit">
    <input v-model="email" type="email" placeholder="you@example.com" required />
    <button :disabled="status === 'submitting'">
      {{ status === "submitting" ? "Joining…" : "Join waitlist" }}
    </button>
    <p v-if="status === 'error'" role="alert">{{ error?.message }}</p>
  </form>
</template>
```

### Bug report with a screenshot

The `screenshot` field takes a base64 data URL — read a file with `FileReader`:

```vue
<script setup lang="ts">
import { ref } from "vue";
import { useSubmit } from "@reloop-sdk/vue";

const { submit, status, error, reset } = useSubmit();
const subject = ref("");
const message = ref("");
const screenshot = ref<string>();

function onFile(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => (screenshot.value = reader.result as string);
  reader.readAsDataURL(file); // data:image/png;base64,...
}

async function onSubmit() {
  await submit({
    type: "bug",
    subject: subject.value,
    message: message.value,
    screenshot: screenshot.value,
    meta: { route: window.location.pathname },
  });
}
</script>

<template>
  <button v-if="status === 'success'" @click="reset">Report another bug</button>
  <form v-else @submit.prevent="onSubmit">
    <input v-model="subject" placeholder="Short summary" required />
    <textarea v-model="message" placeholder="What happened?" required />
    <input type="file" accept="image/*" @change="onFile" />
    <button :disabled="status === 'submitting'">
      {{ status === "submitting" ? "Sending…" : "Send report" }}
    </button>
    <p v-if="status === 'error'" role="alert">{{ error?.message }}</p>
  </form>
</template>
```

## useReloop()

Returns the underlying [`@reloop-sdk/core`](./core.md) client:

```ts
import { useReloop } from "@reloop-sdk/vue";

const reloop = useReloop();
await reloop.submit({ type: "feedback", message: "Nice!" });
```

## FeedbackWidget

Drop-in floating widget that submits a `feedback` item. Register it globally
or import it per-component. Props: `title` (string), `position`
(`"bottom-right" | "bottom-left"`).

```ts
import { FeedbackWidget } from "@reloop-sdk/vue";
app.component("FeedbackWidget", FeedbackWidget);
```
