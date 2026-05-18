# Reloop React Demo

A minimal Vite + React app that uses `@reloop-sdk/react` (linked from the
workspace) so you can click the SDK end-to-end.

## Run

```bash
# 1. From the repo root, build the SDK packages once
pnpm build

# 2. Start the Reloop server (separate terminal)
pnpm --filter @reloop-sdk/server dev          # http://localhost:8787

# 3. In the dashboard (pnpm --filter @reloop-sdk/dashboard dev) create a
#    project + API key, then:
cp examples/react-demo/.env.example examples/react-demo/.env
#    paste the key into VITE_RELOOP_KEY

# 4. Start the demo
pnpm --filter @reloop-sdk/example-react-demo dev   # http://localhost:5174
```

`VITE_RELOOP_ENDPOINT` is left empty so the app uses its own origin and the
Vite dev proxy forwards `/api` to the server on :8787 (no CORS hassle).
Submit via the form or the floating widget, then watch the dashboard's
**Feedback** tab.

If you change the SDK source, re-run `pnpm --filter @reloop-sdk/react build`
(or `pnpm --filter @reloop-sdk/react dev` for watch mode).
