/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Absolute URL of the API server (e.g. https://eaduan-api.onrender.com). */
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
