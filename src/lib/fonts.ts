import { Bebas_Neue, Comic_Neue } from 'next/font/google';

// Bebas Neue — cinematic, sharp, movie-poster grade bold condensed
// Far more refined than Bangers for a portfolio. Used in: Stranger Things,
// countless film trailers, high-end design. Still bold, but controlled.
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

// Backwards-compat alias so layout.tsx doesn't need changing
export const bangers = bebasNeue;
