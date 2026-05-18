# @reloop-sdk/vue

Vue bindings for the [Reloop](https://martystephan.github.io/Reloop/) feedback SDK: a plugin, a `useFeedback()` composable, and a drop-in `FeedbackWidget`.

## Install

```bash
npm install @reloop-sdk/core @reloop-sdk/vue
```

## Usage

Register the plugin once:

```ts
import { createApp } from "vue";
import { ReloopPlugin, FeedbackWidget } from "@reloop-sdk/vue";
import App from "./App.vue";

const app = createApp(App);
app.use(ReloopPlugin, {
  apiKey: "rl_pub_...",
  endpoint: "https://feedback.example.com",
});
app.component("FeedbackWidget", FeedbackWidget);
app.mount("#app");
```

Or build your own UI with the composable:

```ts
import { useFeedback } from "@reloop-sdk/vue";

const { submit, status, error } = useFeedback();
submit({ type: "idea", message: "Add dark mode" });
```

## Documentation

Full API and props: **https://martystephan.github.io/Reloop/sdk/vue**

## License

MIT
