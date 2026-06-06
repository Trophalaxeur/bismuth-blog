/// <reference types="astro/client" />
/// <reference path="../.astro/types.d.ts" />

interface ImportMetaEnv {
  readonly CONTENT_TOKEN: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
