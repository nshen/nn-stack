'use client';

import { cn } from '@nn-stack/ui/lib/utils';
import {
  Users,
  HardDrive,
  LayoutTemplate,
  Component,
} from 'lucide-react';
import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';

export default function PlaygroundPage() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <ExampleCard
        title="User Management"
        description="CRUD operations with Zod validation and ORPC."
        href="/playground/components/users"
        icon={Users}
      />
      <ExampleCard
        title="R2 Storage"
        description="Direct S3-compatible file uploads with progress tracking."
        href="/playground/components/r2-upload"
        icon={HardDrive}
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
