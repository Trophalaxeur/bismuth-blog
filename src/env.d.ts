/// <reference types="astro/client" />
/// <reference path="../.astro/types.d.ts" />

interface ImportMetaEnv {
  readonly CONTENT_TOKEN: string | undefined;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
