'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '@nn-stack/ui/components/tooltip';
import { getQueryClient } from './query-client';

export default function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>{children}</TooltipProvider>
    </QueryClientProvider>
  );
}
