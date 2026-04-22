import type {Metadata} from 'next';
import { Inter, Cormorant_Garamond } from 'next/font/google';
import { AuthProvider } from '@/components/auth/auth-provider';
import { AuthGuard } from '@/components/auth/auth-guard';
import { ThemeProvider } from '@/components/theme-provider';
import { ErrorBoundary } from '@/components/error-boundary';
import { FeedbackDrawer } from '@/components/ui/FeedbackDrawer';
import { CookieConsent } from '@/components/ui/CookieConsent';
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

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" className={`${inter.variable} ${cormorant.variable}`} suppressHydrationWarning>
      <body className="antialiased min-h-screen">
        <ErrorBoundary>
          <AuthProvider>
            <AuthGuard>
              <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
                {children}
                <FeedbackDrawer />
                <CookieConsent />
              </ThemeProvider>
            </AuthGuard>
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
