import alchemy from 'alchemy';
import { TanStackStart } from 'alchemy/cloudflare';
import { CloudflareStateStore } from 'alchemy/state';

const PROJECT_NAME = 'nn-stack';

const app = await alchemy(`${PROJECT_NAME}-tanstack`, {
  stateStore: process.env.CLOUDFLARE_API_TOKEN
    ? // biome-ignore lint/suspicious/noExplicitAny: alchemy scope type is internal
      (scope: any) => new CloudflareStateStore(scope, { forceUpdate: true })
    : undefined,
});

const tanstackDomain =
  app.stage === 'prod'
    ? 'nn.nshen.net'
    : app.stage === 'dev'
      ? 'dev.nn.nshen.net'
      : undefined;

export const tanstack = await TanStackStart('tanstack', {
  name: `${app.name}-${app.stage}`,
  adopt: true,
  ...(tanstackDomain ? { domains: [tanstackDomain] } : {}),
});

console.log({ tanstack: tanstack.url });

await app.finalize();
