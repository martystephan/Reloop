# @reloop-sdk/vanilla

The embeddable [Reloop](https://martystephan.github.io/Reloop/) feedback widget — a single `<script>` tag, no build step.

## Script tag (no install)

The widget auto-initialises from `data-*` attributes:

```html
<script
  src="https://feedback.example.com/embed/reloop.global.js"
  data-reloop-key="rl_pub_..."
  data-reloop-endpoint="https://feedback.example.com"
  data-reloop-position="bottom-right"
></script>
```

## npm

```bash
npm install @reloop-sdk/vanilla
```

```ts
import { mountWidget } from "@reloop-sdk/vanilla";

mountWidget({
  apiKey: "rl_pub_...",
  endpoint: "https://feedback.example.com",
});
```

## Documentation

Full attributes and API: **https://martystephan.github.io/Reloop/sdk/vanilla**

## License

MIT
