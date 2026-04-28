import type { Metadata, Viewport } from 'next';
import { Inter, Cormorant_Garamond } from 'next/font/google';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { ThemeProvider } from '@/components/ThemeProvider';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Toaster } from 'sonner';
import { Header } from '@/components/ui/Header';
import { BottomNav } from '@/components/ui/BottomNav';
import { GlobalMenuSheet } from '@/components/ui/GlobalMenuSheet';
import { KeyboardDetection } from '@/components/ui/KeyboardDetection';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  variable: '--font-serif',
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'WinDear',
  description: 'Your private AI-powered diary for reflection and growth',
  openGraph: {
    title: 'WinDear - Your Private Reflection Sanctuary',
    description: 'A deeply personal AI-powered space to write, reflect, and share your untold stories anonymously.',
    url: 'https://windear.app',
    siteName: 'WinDear',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#0a0a0a',
  // @ts-ignore
  interactiveWidget: 'resizes-content',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" className={`${inter.variable} ${cormorant.variable}`} suppressHydrationWarning>
      <body className="antialiased min-h-screen">
        <KeyboardDetection />
        <ErrorBoundary>
          <AuthProvider>
            <AuthGuard>
              <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
                <Header />
                <BottomNav />
                <GlobalMenuSheet />
                <Toaster position="bottom-right" toastOptions={{
                  style: {
                    background: 'rgba(23, 23, 23, 0.8)',
                    backdropFilter: 'blur(12px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#fff',
                    fontFamily: 'var(--font-serif)',
                  }
                }} />
                {children}
              </ThemeProvider>
            </AuthGuard>
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
