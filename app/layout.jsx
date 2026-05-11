import './globals.css';
import { Playfair_Display, Inter } from 'next/font/google';
import { Analytics } from '@vercel/analytics/next';
import { GoogleAnalytics } from '@next/third-parties/google';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});

export const metadata = {
  metadataBase: new URL('https://www.detoursights.com'),
  title: 'Things to Do & Places to Visit Worldwide | DetourSights',
  description: 'Discover things to do at 91 destinations worldwide — top sights, restaurants, nature spots, nightlife, and hidden gems. Curated places with local tips and practical info.',
  alternates: {
    canonical: 'https://www.detoursights.com',
  },
  other: {
    'theme-color': '#E8602C',
  },
  openGraph: {
    title: 'DetourSights — Discover Things to Do Around the World',
    description: 'Discover things to do at 91 destinations worldwide — top sights, restaurants, nature spots, nightlife, and hidden gems. Curated places with local tips and practical info.',
    url: 'https://www.detoursights.com',
    siteName: 'DetourSights',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DetourSights — Discover Things to Do Around the World',
    description: 'Discover things to do at 91 destinations worldwide — top sights, restaurants, nature spots, nightlife, and hidden gems. Curated places with local tips.',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${playfair.variable} ${inter.variable}`}>
      <body>
        <Header />
        <main>{children}</main>
        <Footer />
        <Analytics />
        <GoogleAnalytics gaId="G-642PQHDP15" />
      </body>
    </html>
  );
}
