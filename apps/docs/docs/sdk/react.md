---
sidebar_position: 2
title: React
---

# @reloop-sdk/react

```bash
npm install @reloop-sdk/core @reloop-sdk/react
```

## Provider

Wrap your app once. Pass client options, or a pre-built `client`.

```tsx
import { ReloopProvider, FeedbackWidget } from "@reloop-sdk/react";

function App() {
  return (
    <ReloopProvider apiKey="rl_pub_..." endpoint="https://feedback.example.com">
      <YourApp />
      <FeedbackWidget />
    </ReloopProvider>
  );
}
```

## useFeedback()

Build your own UI; the hook handles status and errors.

```tsx
import { useFeedback } from "@reloop-sdk/react";

function FeedbackButton() {
  const { submit, status, error } = useFeedback();

  return (
    <button
      disabled={status === "submitting"}
      onClick={() => submit({ type: "idea", message: "Add dark mode" })}
    >
      {status === "submitting" ? "Sending…" : "Send idea"}
      {status === "error" && <span>: {error?.message}</span>}
    </button>
  );
}
```

## useReloop()

Returns the underlying [`@reloop-sdk/core`](./core.md) client directly — useful
for `identify()` after login:

```tsx
const reloop = useReloop();
reloop.identify({ id: user.id, email: user.email });
```

## &lt;FeedbackWidget /&gt;

A drop-in floating launcher + panel.

| Prop       | Type                              | Default          |
| ---------- | --------------------------------- | ---------------- |
| `title`    | `string`                          | `"Send feedback"`|
| `position` | `"bottom-right" \| "bottom-left"` | `"bottom-right"` |
