import { defineConfig } from "tsup";

export default defineConfig([
  {
    entry: { index: "src/index.ts" },
    format: ["esm", "cjs"],
    dts: true,
    clean: true,
    sourcemap: true,
  },
  {
    entry: { "reloop.global": "src/embed.ts" },
    format: ["iife"],
    globalName: "Reloop",
    minify: true,
    sourcemap: true,
    noExternal: ["@reloop-sdk/core"],
  },
]);
