import {os, RouterClient } from '@orpc/server';

export const appRouter = {
	healthCheck: os.handler(() => {
		return "OK";
	}),
};


export type AppRouter = typeof appRouter;
export type AppRouterClient = RouterClient<typeof appRouter>;
