import alchemy from 'alchemy';
import { Nextjs } from 'alchemy/cloudflare';
import { CloudflareStateStore } from 'alchemy/state';

const app = await alchemy('nn-stack-web', {
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
