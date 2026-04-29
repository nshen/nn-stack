import { Toaster } from '@nn-stack/ui/components/sonner';
import { TooltipProvider } from '@nn-stack/ui/components/tooltip';
import uiGlobalsCss from '@nn-stack/ui/styles/globals.css?url';
import type { QueryClient } from '@tanstack/react-query';
import {
  createRootRouteWithContext,
  HeadContent,
  Outlet,
  Scripts,
} from '@tanstack/react-router';
import globalsCss from '~/styles/globals.css?url';

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient;
}>()({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'TanStack Start on Cloudflare Workers' },
      { name: 'description', content: 'Built with Alchemy' },
    ],
    links: [
      { rel: 'stylesheet', href: uiGlobalsCss },
      { rel: 'stylesheet', href: globalsCss },
    ],
  }),
  component: RootComponent,
});

function RootComponent() {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body className="font-sans antialiased" suppressHydrationWarning>
        <TooltipProvider>
          <div className="min-h-svh w-full flex flex-col">
            <Outlet />
          </div>
          <Toaster richColors />
        </TooltipProvider>
        <Scripts />
      </body>
    </html>
  );
}
