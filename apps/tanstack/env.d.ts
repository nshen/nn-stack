/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly NEXT_PUBLIC_SERVER_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
