import { readFileSync } from 'fs';
import { join } from 'path';
import { marked } from 'marked';
import Link from 'next/link';
import { Home } from 'lucide-react';

export const dynamic = 'force-static';

export default function DocsPage() {
  const filePath = join(process.cwd(), 'content', 'user-guide.md');
  const markdown = readFileSync(filePath, 'utf-8');
  const html = marked.parse(markdown, { async: false }) as string;

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-3">
          <span className="text-sm font-bold tracking-tight text-primary">ReconSMI Docs</span>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            <Home className="size-3.5" /> Back to app
          </Link>
        </div>
      </div>
      <div className="mx-auto max-w-4xl px-6 py-12">
        <div className="docs-content max-w-none" dangerouslySetInnerHTML={{ __html: html }} />
      </div>
    </div>
  );
}