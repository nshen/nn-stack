import { Button } from '@nn-stack/ui/components/button';
import { Github } from 'lucide-react';
import Link from 'next/link';

interface SourceCodeButtonProps {
  path: string;
}

export function SourceCodeButton({ path }: SourceCodeButtonProps) {
  const githubUrl = `https://github.com/nshen/nn-stack/blob/main/${path}`;

  return (
    <Button variant="outline" size="sm" asChild className="gap-2">
      <Link href={githubUrl} target="_blank" rel="noopener noreferrer">
        <Github className="h-4 w-4" />
        Source Code
      </Link>
    </Button>
  );
}
