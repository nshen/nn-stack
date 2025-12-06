'use client';

import { cn } from '@nn-stack/ui/lib/utils';
import {
  type LucideIcon,
  Check,
  CircleAlert,
  Database,
  Loader2,
  Server,
  Workflow,
  Terminal,
  Code,
  Globe,
  Github,
} from 'lucide-react';
import Link from 'next/link';
import { orpc } from '@/lib/orpc';
import { useQuery } from '@tanstack/react-query';

export default function Home() {
  return (
    <main className="w-full max-w-5xl mx-auto px-4 py-12 flex flex-col gap-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-border/40">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Terminal className="w-6 h-6" />
            NN-Stack Console
          </h1>
          <p className="text-muted-foreground">
            System operational.{' '}
            <span className="text-emerald-500 font-medium">
              Ready for requests.
            </span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/playground"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5 px-3 py-1.5 rounded-md hover:bg-muted"
          >
            <Code size={16} />
            Playground
          </Link>
          <Link
            href={process.env.NEXT_PUBLIC_SERVER_URL || '#'}
            target="_blank"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5 px-3 py-1.5 rounded-md hover:bg-muted"
          >
            <Server size={16} />
            API Server
          </Link>
          <Link
            href="https://github.com/nshen/nn-stack"
            target="_blank"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5 px-3 py-1.5 rounded-md hover:bg-muted"
          >
            <Github size={16} />
            GitHub
          </Link>
        </div>
      </div>

      {/* System Status */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          System Status
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatusCheckCard
            title="API Connection"
            description="Hono Worker via ORPC"
            queryKey="connection"
            icon={Server}
          />
          <StatusCheckCard
            title="KV Storage"
            description="Cloudflare Workers KV"
            queryKey="kv"
            icon={Workflow}
          />
          <StatusCheckCard
            title="D1 Database"
            description="Serverless SQLite Edge DB"
            queryKey="db"
            icon={Database}
          />
        </div>
      </section>

      {/* Quick Links / Resources */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Resources
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <ResourceCard
            title="Next.js Docs"
            href="https://nextjs.org/docs"
            icon={Globe}
          />
          <ResourceCard
            title="Hono Docs"
            href="https://hono.dev"
            icon={Globe}
          />
          <ResourceCard
            title="ORPC Docs"
            href="https://orpc.dev"
            icon={Globe}
          />
          <ResourceCard
            title="Cloudflare Docs"
            href="https://developers.cloudflare.com/workers/"
            icon={Globe}
          />
        </div>
      </section>

      {/* Footer Actions */}
      <div className="mt-auto pt-12 flex flex-col items-center gap-8 border-t border-border/40">
        <p className="text-xs text-muted-foreground font-mono">
          Edit{' '}
          <span className="bg-muted px-1 py-0.5 rounded text-foreground">
            apps/web/app/page.tsx
          </span>{' '}
          to start building your app.
        </p>
      </div>
    </main>
  );
}

function ResourceCard({
  title,
  href,
  icon: Icon,
}: {
  title: string;
  href: string;
  icon: LucideIcon;
}) {
  return (
    <Link
      href={href}
      target="_blank"
      className="group flex items-center gap-3 p-4 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors"
    >
      <div className="p-2 rounded-md bg-muted group-hover:bg-background transition-colors">
        <Icon
          size={18}
          className="text-muted-foreground group-hover:text-foreground"
        />
      </div>
      <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
        {title}
      </span>
    </Link>
  );
}

function StatusCheckCard({
  title,
  description,
  queryKey,
  icon: Icon,
}: {
  title: string;
  description: string;
  queryKey: 'connection' | 'kv' | 'db';
  icon: LucideIcon;
}) {
  const query = useQuery(orpc.healthCheck[queryKey].queryOptions());

  return (
    <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-card">
      <div className="flex items-center gap-4">
        <div className="p-2 bg-muted rounded-md text-muted-foreground">
          <Icon size={20} />
        </div>
        <div>
          <h3 className="text-sm font-medium text-foreground leading-none mb-1">
            {title}
          </h3>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>

      <div
        className={cn(
          'flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border transition-colors',
          query.isLoading
            ? 'bg-muted text-muted-foreground border-transparent'
            : query.isError || !query.data
              ? 'bg-red-500/10 text-red-600 border-red-200/50'
              : 'bg-emerald-500/10 text-emerald-600 border-emerald-200/50',
        )}
      >
        {query.isLoading ? (
          <Loader2 size={12} className="animate-spin" />
        ) : query.isError || !query.data ? (
          <CircleAlert size={12} />
        ) : (
          <Check size={12} />
        )}
        <span className="capitalize">
          {query.isLoading
            ? 'Checking'
            : query.isError || !query.data
              ? 'Error'
              : 'Healthy'}
        </span>
      </div>
    </div>
  );
}
