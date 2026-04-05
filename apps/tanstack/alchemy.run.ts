import alchemy from 'alchemy';
import { TanStackStart } from 'alchemy/cloudflare';
import { CloudflareStateStore } from 'alchemy/state';

const PROJECT_NAME = 'nn-stack';

const app = await alchemy(`${PROJECT_NAME}-tanstack`, {
  stateStore: process.env.CLOUDFLARE_API_TOKEN
    ? (scope: any) => new CloudflareStateStore(scope, { forceUpdate: true })
    : undefined,
});

export const tanstack = await TanStackStart('tanstack', {
  name: `${app.name}-${app.stage}`,
  adopt: true,
});

console.log({ tanstack: tanstack.url });

await app.finalize();
