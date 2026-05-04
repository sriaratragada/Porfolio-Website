import type { Metadata } from 'next';
import { bebasNeue, comicNeue } from '@/lib/fonts';
import LenisProvider from '@/components/layout/LenisProvider';
import Navigation from '@/components/layout/Navigation';
import Footer from '@/components/layout/Footer';
// Client component wrapper with ssr: false — keeps Three.js out of the server bundle
import SceneCanvasLoader from '@/components/three/SceneCanvasLoader';
import './globals.css';

export const metadata: Metadata = {
  title: 'Spider-Verse Portfolio',
  description: 'A comic book styled personal portfolio',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${bebasNeue.variable} ${comicNeue.variable}`}>
      <body className="min-h-screen antialiased" style={{ fontFamily: 'var(--font-comic-neue), Comic Neue, cursive' }}>
        <LenisProvider>
          <SceneCanvasLoader />
          <Navigation />
          <div className="paper-grain" />
          <main className="relative z-10">
            {children}
          </main>
          <Footer />
        </LenisProvider>
      </body>
    </html>
  );
}
