import { Inter } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import { Providers } from './providers';
import '../styles/globals.css';

const inter = Inter({
  subsets:   ['latin'],
  variable:  '--font-inter',
  display:   'swap',
});

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://eventsphere.vercel.app'),
  title:       'EventSphere — AI-Powered Event Management',
  description: 'Discover, create, and manage events with AI-powered recommendations, seamless ticketing, and real-time check-ins.',
  keywords:    'events, ticketing, event management, AI events, online events',
  openGraph: {
    title:       'EventSphere',
    description: 'AI-Powered Event Management & Ticketing Platform',
    type:        'website',
    url:         'https://eventsphere.vercel.app',
    images:      [{ url: '/images/og-image.png', width: 1200, height: 630 }],
  },
  twitter: {
    card:        'summary_large_image',
    title:       'EventSphere',
    description: 'AI-Powered Event Management & Ticketing Platform',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <body>
        {/* 🌟 Providers now cleanly feeds down both Redux and Themes across the boundary! */}
        <Providers>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                borderRadius: '12px',
                fontSize:     '14px',
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}