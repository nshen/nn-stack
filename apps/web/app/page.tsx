'use client';
import { orpc } from '@/lib/orpc';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@nn-stack/ui/components/button';

export default function Home() {
  const connectionCheck = useQuery(orpc.healthCheck.connection.queryOptions());
  const kvCheck = useQuery(orpc.healthCheck.kv.queryOptions());
  const dbCheck = useQuery(orpc.healthCheck.db.queryOptions());

  return (
    // Centering the content, adding gaps, and ensuring it grows
    <main className="w-full max-w-4xl mx-auto p-8 flex-grow flex flex-col items-center justify-center gap-y-12">
      {/* Header Section */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tighter">
          Welcome to{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-500 to-emerald-500">
            nn-stack!
          </span>
        </h1>
        <p className="text-lg text-gray-600">
          A Next.js application deployed to Cloudflare Workers using{' '}
          <a
            href="https://alchemy.run"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sky-600 font-medium hover:underline"
          >
            Alchemy
          </a>
          .
        </p>
      </div>

      {/* Content Cards Section */}
      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* API Status Card */}
        <div className="rounded-lg border bg-white shadow-sm p-6 flex flex-col gap-4">
          <h2 className="text-xl font-semibold text-gray-800">API Status</h2>
          <div className="flex items-center gap-3">
            <div
              className={`h-2.5 w-2.5 rounded-full ${connectionCheck.isLoading ? 'animate-pulse bg-gray-400' : connectionCheck.data ? 'bg-green-500' : 'bg-red-500'}`}
            />
            <span className="text-sm text-gray-500">
              {connectionCheck.isLoading
                ? 'Checking connection...'
                : connectionCheck.data
                  ? 'Connected & Healthy'
                  : 'Disconnected'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div
              className={`h-2.5 w-2.5 rounded-full ${kvCheck.isLoading ? 'animate-pulse bg-gray-400' : kvCheck.data ? 'bg-green-500' : 'bg-red-500'}`}
            />
            <span className="text-sm text-gray-500">
              {kvCheck.isLoading
                ? 'Checking KV...'
                : kvCheck.data
                  ? 'KV & Healthy'
                  : 'Disconnected'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div
              className={`h-2.5 w-2.5 rounded-full ${dbCheck.isLoading ? 'animate-pulse bg-gray-400' : dbCheck.data ? 'bg-green-500' : 'bg-red-500'}`}
            />
            <span className="text-sm text-gray-500">
              {dbCheck.isLoading
                ? 'Checking D1...'
                : dbCheck.data
                  ? 'D1 & Healthy'
                  : 'Disconnected'}
            </span>
          </div>
        </div>

        {/* Get Started Card */}
        <div className="rounded-lg border bg-white shadow-sm p-6 flex flex-col gap-4">
          <h2 className="text-xl font-semibold text-gray-800">Get Started</h2>
          <p className="text-sm text-gray-500">
            Edit the file below and save to see your changes.
            <br />
            <code className="mt-2 inline-block rounded bg-gray-100 px-2 py-1 font-mono text-xs font-semibold text-gray-700">
              apps/web/app/page.tsx
            </code>
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-auto pt-8 text-center text-gray-500 text-sm">
        <div className="border-t w-full mb-4" />
        <p>
          Learn more:{' '}
          <a
            href="https://nextjs.org/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-sky-600 hover:underline"
          >
            Next.js Docs
          </a>
          <span className="mx-2">|</span>
          <a
            href="https.alchemy.run"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-sky-600 hover:underline"
          >
            Alchemy Docs
          </a>
        </p>
      </footer>
    </main>
  );
}
