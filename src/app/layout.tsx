import type { Metadata } from 'next';
import { bebasNeue, comicNeue, spaceGrotesk, jetbrainsMono } from '@/lib/fonts';
import LenisProvider from '@/components/layout/LenisProvider';
import Navigation from '@/components/layout/Navigation';
import Footer from '@/components/layout/Footer';
// Client component wrapper with ssr: false — keeps Three.js out of the server bundle
import SceneCanvasLoader from '@/components/three/SceneCanvasLoader';
import './globals.css';

export const metadata: Metadata = {
  title: 'Portfolio — 2026',
  description: 'A high-end technical noir portfolio',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${bebasNeue.variable} ${comicNeue.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable}`}
    >
      <body className="min-h-screen antialiased">
        <LenisProvider>
          <SceneCanvasLoader />
          <Navigation />
          <div className="paper-grain" />
          <main className="relative z-10 pointer-events-none">
            {children}
          </main>
          <Footer />
        </LenisProvider>
      </body>
    </html>
  );
}
