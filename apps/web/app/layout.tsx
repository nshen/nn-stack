import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import Providers from '@/lib/providers';
import { Toaster } from '@nn-stack/ui/components/sonner';
import '@nn-stack/ui/styles/globals.css';
import './globals.css';

export const metadata: Metadata = {
  title: 'Next.js on Cloudflare Workers',
  description: 'Built with Alchemy',
};

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <Providers>
          <div className="min-h-svh w-full flex flex-col">{children}</div>
          <Toaster richColors />
        </Providers>
      </body>
    </html>
  );
}
