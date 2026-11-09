/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Opcional: apunta a otro servidor. Por defecto las rutas /api/... son relativas. */
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
