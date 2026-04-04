import type {Metadata, Viewport} from 'next';
import { Inter } from 'next/font/google';
import { AuthProvider } from '@/components/auth/auth-provider';
import { I18nProvider } from '@/components/i18n-provider';
import { PageTransition } from '@/components/page-transition';
import { ThemeProvider } from '@/components/theme-provider';
import { ErrorBoundary } from '@/components/error-boundary';
import { CookieConsent } from '@/components/ui/CookieConsent';
import { GoogleAnalytics } from '@next/third-parties/google';
import { Suspense } from 'react';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: {
    default: 'WinDear | AI-Powered Private Diary',
    template: '%s | WinDear'
  },
  description: 'WinDear is your private, AI-powered diary for reflection, growth, and emotional clarity. Secure, multilingual, and insightful.',
  keywords: ['diary', 'journal', 'AI', 'reflection', 'growth', 'mental health', 'privacy', 'multilingual'],
  authors: [{ name: 'WinDear Team' }],
  creator: 'WinDear',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://windear.app',
    title: 'WinDear | AI-Powered Private Diary',
    description: 'Your private AI-powered diary for reflection and growth.',
    siteName: 'WinDear',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'WinDear | AI-Powered Private Diary',
    description: 'Your private AI-powered diary for reflection and growth.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F9FAFB' },
    { media: '(prefers-color-scheme: dark)', color: '#0A0A0A' },
  ],
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} bg-[#F9FAFB] dark:bg-[#0A0A0A] text-[#111827] dark:text-[#F9FAFB] min-h-screen transition-colors duration-300`} suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <Suspense fallback={null}>
            <I18nProvider>
              <AuthProvider>
                <ErrorBoundary>
                  <PageTransition>
                    {children}
                  </PageTransition>
                  <CookieConsent />
                </ErrorBoundary>
              </AuthProvider>
            </I18nProvider>
          </Suspense>
          <GoogleAnalytics gaId="G-65HWFY2J17" />
        </ThemeProvider>
      </body>
    </html>
  );
}
