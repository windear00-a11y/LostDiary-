import type {Metadata, Viewport} from 'next';
import { Inter, Cormorant_Garamond } from 'next/font/google';
import { AuthProvider } from '@/components/auth/auth-provider';
import { PageTransition } from '@/components/page-transition';
import { ThemeProvider } from '@/components/theme-provider';
import { ErrorBoundary } from '@/components/error-boundary';
import { Suspense } from 'react';
import Script from 'next/script';
import { SkyProvider } from '@/lib/sky-context';
import { StarryBackground } from '@/components/ui/StarryBackground';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });
const cormorant = Cormorant_Garamond({ 
  subsets: ['latin'], 
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-serif' 
});

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
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${cormorant.variable}`}>
      <body className={`${inter.className} bg-transparent text-[#111827] dark:text-[#F9FAFB] min-h-screen transition-colors duration-300`} suppressHydrationWarning>
        <Script 
          src="https://cdn.jsdelivr.net/npm/astronomy-engine@2.1.19/astronomy.min.js" 
          strategy="beforeInteractive" 
        />
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <SkyProvider>
            <StarryBackground />
            <Suspense fallback={null}>
              <AuthProvider>
                <ErrorBoundary>
                  <PageTransition>
                    {children}
                  </PageTransition>
                </ErrorBoundary>
              </AuthProvider>
            </Suspense>
          </SkyProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
