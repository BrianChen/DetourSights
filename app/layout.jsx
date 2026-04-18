import './globals.css';
import { Playfair_Display, Inter } from 'next/font/google';
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
  title: 'Detour Sights',
  description: 'Discover the best things to do, places to eat, and hidden gems at destinations around the world.',
  alternates: {
    canonical: 'https://www.detoursights.com',
  },
  openGraph: {
    title: 'Detour Sights',
    description: 'Discover the best things to do, places to eat, and hidden gems at destinations around the world.',
    url: 'https://www.detoursights.com',
    siteName: 'Detour Sights',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Detour Sights',
    description: 'Discover the best things to do, places to eat, and hidden gems at destinations around the world.',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${playfair.variable} ${inter.variable}`}>
      <body>
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}
