import alchemy from 'alchemy';
import { Nextjs } from 'alchemy/cloudflare';
import { CloudflareStateStore } from 'alchemy/state';

const PROJECT_NAME = 'nn-stack';

const app = await alchemy(`${PROJECT_NAME}-web`, {
  stateStore: process.env.CLOUDFLARE_API_TOKEN
    ? (scope: any) => new CloudflareStateStore(scope, { forceUpdate: true })
    : undefined,
});

export const web = await Nextjs('web', {
  name: `${app.name}-${app.stage}`,
  adopt: true,
});

console.log({ web: web.url });

await app.finalize();
