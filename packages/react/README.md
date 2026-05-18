# @reloop-sdk/react

React bindings for the [Reloop](https://martystephan.github.io/Reloop/) feedback SDK: a provider, a `useFeedback()` hook, and a drop-in `<FeedbackWidget />`.

## Install

```bash
npm install @reloop-sdk/core @reloop-sdk/react
```

## Usage

Wrap your app once, then drop in the widget:

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

Or build your own UI with the hook:

```tsx
import { useFeedback } from "@reloop-sdk/react";

const { submit, status, error } = useFeedback();
submit({ type: "idea", message: "Add dark mode" });
```

## Documentation

Full API and props: **https://martystephan.github.io/Reloop/sdk/react**

## License

MIT
