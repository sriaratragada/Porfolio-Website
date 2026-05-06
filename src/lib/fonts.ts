import { Bebas_Neue, Comic_Neue, Space_Grotesk, JetBrains_Mono } from 'next/font/google';

// Bebas Neue — cinematic condensed, used for phase labels + nav items
export const bebasNeue = Bebas_Neue({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-bebas',
  display: 'swap',
});

export const comicNeue = Comic_Neue({
  weight: ['300', '400', '700'],
  subsets: ['latin'],
  variable: '--font-comic-neue',
  display: 'swap',
});

// Space Grotesk — modern geometric sans, Extra Bold (700)
// Used for the main hero heading — outline + glow treatment
export const spaceGrotesk = Space_Grotesk({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  display: 'swap',
});

// JetBrains Mono — developer monospace, used for the tagline
export const jetbrainsMono = JetBrains_Mono({
  weight: ['300', '400', '500'],
  subsets: ['latin'],
  variable: '--font-jetbrains',
  display: 'swap',
});

// Backwards-compat alias so existing components don't break
export const bangers = bebasNeue;
