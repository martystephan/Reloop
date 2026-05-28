# @reloop-sdk/react

React bindings for the [Reloop](https://martystephan.github.io/Reloop/) SDK: a provider, a `useSubmit()` hook, and a drop-in `<FeedbackWidget />`.

```bash
npm install @reloop-sdk/core @reloop-sdk/react
```

## 1. Wrap your app

Provide the client once, near the root. Each API key is locked to a single
item type (`bug`, `feedback`, `waitlist`, `question` or `other`).

```tsx
import { ReloopProvider } from "@reloop-sdk/react";

export function Root() {
  return (
    <ReloopProvider apiKey="rl_pub_..." endpoint="https://reloop.example.com">
      <App />
    </ReloopProvider>
  );
}
```

## 2. Use the hook

`useSubmit()` returns `{ submit, reset, status, error, isSubmitting }`.
`status` is `"idle" | "submitting" | "success" | "error"`. Build any UI you
like on top of it.

### Waitlist form

```tsx
import { useState } from "react";
import { useSubmit } from "@reloop-sdk/react";

export function WaitlistForm() {
  const { submit, status, error } = useSubmit();
  const [email, setEmail] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    await submit({ type: "waitlist", email });
  }

  if (status === "success") return <p>You're on the list! 🎉</p>;

  return (
    <form onSubmit={onSubmit}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        required
      />
      <button disabled={status === "submitting"}>
        {status === "submitting" ? "Joining…" : "Join waitlist"}
      </button>
      {status === "error" && <p role="alert">{error?.message}</p>}
    </form>
  );
}
```

### Bug report with a screenshot

The `screenshot` field takes a base64 data URL — read a file with `FileReader`:

```tsx
import { useState } from "react";
import { useSubmit } from "@reloop-sdk/react";

export function BugReportForm() {
  const { submit, status, error, reset } = useSubmit();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [screenshot, setScreenshot] = useState<string>();

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setScreenshot(reader.result as string);
    reader.readAsDataURL(file); // data:image/png;base64,...
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    await submit({
      type: "bug",
      subject,
      message,
      screenshot,
      meta: { route: window.location.pathname },
    });
  }

  if (status === "success") {
    return <button onClick={reset}>Report another bug</button>;
  }

  return (
    <form onSubmit={onSubmit}>
      <input
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        placeholder="Short summary"
        required
      />
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="What happened?"
        required
      />
      <input type="file" accept="image/*" onChange={onFile} />
      <button disabled={status === "submitting"}>
        {status === "submitting" ? "Sending…" : "Send report"}
      </button>
      {status === "error" && <p role="alert">{error?.message}</p>}
    </form>
  );
}
```

### Feedback in one line

```tsx
const { submit } = useSubmit();
<button onClick={() => submit({ type: "feedback", message: "Love it!" })}>
  Send feedback
</button>;
```

## useReloop()

Returns the underlying [`@reloop-sdk/core`](https://martystephan.github.io/Reloop/sdk/core) client, if you need to call `submit` outside React state:

```tsx
import { useReloop } from "@reloop-sdk/react";

const reloop = useReloop();
await reloop.submit({ type: "feedback", message: "Nice!" });
```

## &lt;FeedbackWidget /&gt;

A drop-in floating launcher + panel that submits a `feedback` item. Use it
with a key whose type is `feedback`.

```tsx
import { ReloopProvider, FeedbackWidget } from "@reloop-sdk/react";

<ReloopProvider apiKey="rl_pub_..." endpoint="https://reloop.example.com">
  <App />
  <FeedbackWidget title="Send feedback" position="bottom-right" />
</ReloopProvider>;
```

| Prop       | Type                              | Default          |
| ---------- | --------------------------------- | ---------------- |
| `title`    | `string`                          | `"Send feedback"`|
| `position` | `"bottom-right" \| "bottom-left"` | `"bottom-right"` |

## Documentation

Full API and props: **https://martystephan.github.io/Reloop/sdk/react**

## License

MIT
