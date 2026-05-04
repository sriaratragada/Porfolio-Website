'use client';

import { useEffect, useRef, createContext, useContext, type ReactNode } from 'react';
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { scrollStore } from '@/lib/scrollStore';

gsap.registerPlugin(ScrollTrigger);

const LenisContext = createContext<Lenis | null>(null);

export function useLenis() {
  return useContext(LenisContext);
}

export default function LenisProvider({ children }: { children: ReactNode }) {
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    });

    lenisRef.current = lenis;

    // Keep GSAP ScrollTrigger in sync
    lenis.on('scroll', () => {
      ScrollTrigger.update();
    });

    // Update the shared scroll store — R3F components read this in useFrame
    lenis.on('scroll', (e: { progress: number; velocity: number }) => {
      scrollStore.globalProgress = e.progress;
      scrollStore.scrollVelocity = e.velocity;
    });

    // Drive lenis from GSAP's ticker (no duplicate RAF loops)
    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });

    gsap.ticker.lagSmoothing(0);

    return () => {
      lenis.destroy();
    };
  }, []);

  return (
    <LenisContext.Provider value={lenisRef.current}>
      {children}
    </LenisContext.Provider>
  );
}
