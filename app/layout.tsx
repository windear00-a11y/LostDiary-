import type {Metadata} from 'next';
import { Inter } from 'next/font/google';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Analytics } from '@vercel/analytics/next';
import { AuthProvider } from '@/components/auth/auth-provider';
import { I18nProvider } from '@/components/i18n-provider';
import { PageTransition } from '@/components/page-transition';
import { ThemeProvider } from '@/components/theme-provider';
import { ErrorBoundary } from '@/components/error-boundary';
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

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} bg-[#F9FAFB] text-[#111827] min-h-screen`} suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <I18nProvider>
            <AuthProvider>
              <ErrorBoundary>
                <PageTransition>
                  {children}
                </PageTransition>
              </ErrorBoundary>
            </AuthProvider>
          </I18nProvider>
        </ThemeProvider>
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
