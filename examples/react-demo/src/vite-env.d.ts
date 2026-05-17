/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_RELOOP_KEY?: string;
  readonly VITE_RELOOP_ENDPOINT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
