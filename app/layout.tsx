import type {Metadata, Viewport} from 'next';
import { Inter, Cormorant_Garamond } from 'next/font/google';
import { AuthProvider } from '@/components/auth/auth-provider';
import { AuthGuard } from '@/components/auth/auth-guard';
import { ThemeProvider } from '@/components/theme-provider';
import { ErrorBoundary } from '@/components/error-boundary';
import { Suspense } from 'react';
import './globals.css';

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body className="antialiased">
        <ErrorBoundary>
          <AuthProvider>
            <AuthGuard>
              <ThemeProvider>
                <Suspense fallback={null}>
                  {children}
                </Suspense>
              </ThemeProvider>
            </AuthGuard>
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
