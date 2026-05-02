/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CLIENT_EMAIL: string;
  readonly VITE_CLIENT_NAME: string;
  readonly VITE_CLIENT_ROLL: string;
  readonly VITE_CLIENT_ACCESS_CODE: string;
  readonly VITE_CLIENT_ID: string;
  readonly VITE_CLIENT_SECRET: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
