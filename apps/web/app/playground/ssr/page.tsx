import { getQueryClient } from '@/lib/query-client';
import { orpc } from '@/lib/orpc';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { PlanetsList } from './planets-list';
import { SourceCodeButton } from '@/components/source-code-button';

export const dynamic = 'force-dynamic';

export default async function SSRDemoPage() {
  const queryClient = getQueryClient();

  // Prefetch data on the server
  // This executes an HTTP request from the Next.js server to the Hono server
  await queryClient.prefetchQuery(orpc.planet.list.queryOptions());

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">SSR & Hydration Demo</h1>
          <p className="text-muted-foreground mt-2">
            The data below is prefetched on the server and hydrated on the client.
            View the page source to confirm the data is present in the HTML.
          </p>
        </div>
        <SourceCodeButton path="apps/web/app/playground/ssr/page.tsx" />
      </div>

      <div className="p-6 bg-slate-50 border rounded-lg">
        {/* Pass the dehydrated state to the boundary */}
        <HydrationBoundary state={dehydrate(queryClient)}>
          <PlanetsList />
        </HydrationBoundary>
      </div>
    </div>
  );
}
