// Auto-generated Cloudflare binding types.
// @see https://alchemy.run/concepts/bindings/#type-safe-bindings

import type { web } from './alchemy.run.ts';
import type { CloudflareEnv as ApiEnv } from '@nn-stack/api/env';

export type WebEnv = typeof web.Env;

declare module 'cloudflare:workers' {
  namespace Cloudflare {
    export interface Env extends WebEnv, ApiEnv {}
  }
}
