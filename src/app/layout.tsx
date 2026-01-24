import type { Metadata } from 'next';
import './globals.css';
import { SessionProvider } from '@/hooks/use-session';
import { Toaster } from '@/components/ui/toaster';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { CartProvider } from '@/hooks/use-cart';
import { ProfileLocationsProvider } from '@/hooks/use-profile-locations';

export const metadata: Metadata = {
  title: 'XLEats',
  description: 'A modern solution for campus dining.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=PT+Sans:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <FirebaseClientProvider>
          <SessionProvider>
            <CartProvider>
              <ProfileLocationsProvider>
                {children}
                <Toaster />
              </ProfileLocationsProvider>
            </CartProvider>
          </SessionProvider>
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
