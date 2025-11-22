import { createORPCClient } from '@orpc/client';
import { RPCLink } from '@orpc/client/fetch';

import { AppRouterClient } from '@/routes';
const link = new RPCLink({
  url: 'http://127.0.0.1:3000',
  headers: { Authorization: 'Bearer token' },
});

export const orpc: AppRouterClient = createORPCClient(link);

orpc.healthCheck();
