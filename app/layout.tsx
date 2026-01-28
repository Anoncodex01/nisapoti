import './globals.css';
import type { Metadata } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import { AuthProvider } from '@/contexts/AuthContext';
import { Toaster } from '@/components/ui/toaster';

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
});

const playfair = Playfair_Display({ 
  subsets: ['latin'],
  variable: '--font-playfair',
});

const siteUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://nisapoti.com';
const siteTitle = 'Nisapoti - Support Your Favorite Creators Globally';
const siteDescription =
  'Empower creators across Tanzania to share their art, music, and content while earning support from their community.';
const defaultOgImage = `${siteUrl}/logonis.png`;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: siteTitle,
  description: siteDescription,
  icons: {
    icon: '/logonis.png',
    apple: '/logonis.png'
  },
  openGraph: {
    type: 'website',
    url: siteUrl,
    title: siteTitle,
    description: siteDescription,
    images: [
      {
        url: defaultOgImage,
        width: 1200,
        height: 630,
        alt: 'Nisapoti logo'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: siteTitle,
    description: siteDescription,
    images: [defaultOgImage]
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${playfair.variable} font-sans antialiased`}>
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}