/// <reference types="vite/client" />
/// <reference path="../../packages/api/env.d.ts" />

interface ImportMetaEnv {
  readonly NEXT_PUBLIC_SERVER_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
