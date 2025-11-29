import alchemy from 'alchemy';
import { Nextjs } from 'alchemy/cloudflare';

const app = await alchemy('nn-stack');

export const web = await Nextjs('web', {
  name: `${app.name}-web-${app.stage}`,
});

console.log({ url: web.url });

await app.finalize();
