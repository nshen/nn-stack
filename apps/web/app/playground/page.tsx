'use client';

import { cn } from '@nn-stack/ui/lib/utils';
import {
  ArrowLeft,
  FlaskConical,
  Users,
  LayoutTemplate,
  Component,
} from 'lucide-react';
import Link from 'next/link';
import { type LucideIcon } from 'lucide-react';

export default function PlaygroundPage() {
  return (
    <main className="w-full max-w-5xl mx-auto px-4 py-12 flex flex-col gap-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-border/40">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <FlaskConical className="w-6 h-6" />
            Playground
          </h1>
          <p className="text-muted-foreground">
            Component demos and integration patterns.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5 px-3 py-1.5 rounded-md hover:bg-muted"
          >
            <ArrowLeft size={16} />
            Back to Console
          </Link>
        </div>
      </div>

      {/* Examples Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <ExampleCard
          title="User Management"
          description="CRUD operations with Zod validation and ORPC."
          href="/playground/components/users"
          icon={Users}
        />
        <ExampleCard
          title="Todo List"
          description="Interactive task list with optimistic updates."
          href="#"
          icon={LayoutTemplate}
          disabled
        />
        <ExampleCard
          title="Form Components"
          description="Shadcn UI form elements showcase."
          href="#"
          icon={Component}
          disabled
        />
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
    </main>
  );
}

function ExampleCard({
  title,
  description,
  href,
  icon: Icon,
  disabled = false,
}: {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  disabled?: boolean;
}) {
  const Content = (
    <>
      <div
        className={cn(
          'p-2 rounded-md transition-colors',
          disabled
            ? 'bg-muted text-muted-foreground'
            : 'bg-muted text-muted-foreground group-hover:text-foreground group-hover:bg-background',
        )}
      >
        <Icon size={20} />
      </div>
      <div>
        <h3 className="text-sm font-medium text-foreground leading-none mb-1">
          {title}
        </h3>
        <p className="text-xs text-muted-foreground line-clamp-2">
          {description}
        </p>
      </div>
    </>
  );

  if (disabled) {
    return (
      <div className="flex items-center gap-4 p-4 rounded-lg border border-border bg-muted/30 opacity-60 cursor-not-allowed">
        {Content}
      </div>
    );
  }

  return (
    <Link
      href={href}
      className="group flex items-center gap-4 p-4 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors hover:shadow-sm hover:border-primary/20"
    >
      {Content}
    </Link>
  );
}
