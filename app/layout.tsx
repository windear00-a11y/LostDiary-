import type {Metadata, Viewport} from 'next';
import { Inter, Cormorant_Garamond } from 'next/font/google';
import { AuthProvider } from '@/components/auth/auth-provider';
import { PageTransition } from '@/components/page-transition';
import { ThemeProvider } from '@/components/theme-provider';
import { ErrorBoundary } from '@/components/error-boundary';
import { Suspense } from 'react';
import { SkyProvider } from '@/lib/sky-context';
import { StarryBackground } from '@/components/ui/StarryBackground';
import './globals.css';

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body className="antialiased">
        <ErrorBoundary>
          <AuthProvider>
            <ThemeProvider>
              <Suspense fallback={null}>
                {children}
              </Suspense>
            </ThemeProvider>
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
