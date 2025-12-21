'use client';

import { cn } from '@nn-stack/ui/lib/utils';
import {
  ArrowLeft,
  FlaskConical,
  ChevronRight,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function PlaygroundLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isIndex = pathname === '/playground';

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-12 flex flex-col gap-12">
      {/* Shared Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-border/40">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Link 
              href="/playground" 
              className={cn(
                "flex items-center gap-2 transition-colors hover:opacity-80",
                !isIndex && "text-muted-foreground"
              )}
            >
              <FlaskConical className="w-6 h-6" />
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Playground
              </h1>
            </Link>
            {!isIndex && (
              <>
                <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
                <span className="text-xl font-medium tracking-tight text-foreground">
                  Component
                </span>
              </>
            )}
          </div>
          <p className="text-muted-foreground text-sm">
            {isIndex 
              ? "Component demos and integration patterns." 
              : "Explore and test the component implementation."}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Link
            href={isIndex ? "/" : "/playground"}
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5 px-3 py-1.5 rounded-md hover:bg-muted"
          >
            <ArrowLeft size={16} />
            {isIndex ? "Back to Console" : "Back to Playground"}
          </Link>
        </div>
      </div>

      {/* Page Content */}
      <div className="min-h-[400px]">
        {children}
      </div>

      {/* Hint */}
      <div className="mt-auto pt-6 border-t border-border/40 text-center">
        <p className="text-xs text-muted-foreground font-mono">
          Add new examples in{' '}
          <span className="bg-muted px-1 py-0.5 rounded text-foreground">
            apps/web/app/playground/
          </span>
        </p>
      </div>
    </div>
  );
}
