import type { AppRouterClient } from '@nn-stack/api';
import { createORPCClient, onError } from '@orpc/client';
import { RPCLink } from '@orpc/client/fetch';
import { createTanstackQueryUtils } from '@orpc/tanstack-query';

export const link = new RPCLink({
  url: `${import.meta.env.NEXT_PUBLIC_SERVER_URL}/rpc`,
  headers: () => ({
    authorization: 'Bearer token',
  }),
  interceptors: [
    onError((error) => {
      if ((error as Error).name === 'AbortError') {
        return;
      }
      console.error(error);
    }),
  ],
});

export const client: AppRouterClient = createORPCClient(link);

export const orpc = createTanstackQueryUtils(client);
