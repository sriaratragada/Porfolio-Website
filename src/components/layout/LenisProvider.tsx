'use client';

import { useEffect, useState, createContext, useContext, type ReactNode } from 'react';
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
  // Use useState so consumers get the live instance, not the null initial value
  const [lenis, setLenis] = useState<Lenis | null>(null);

  useEffect(() => {
    const l = new Lenis({
      duration: 1.2,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    });

    // Keep GSAP ScrollTrigger in sync
    l.on('scroll', () => {
      ScrollTrigger.update();
    });

    // Update the shared scroll store — R3F components read this in useFrame.
    // Also fan out to subscribers (e.g. PhotoSphereControls cursor detection).
    l.on('scroll', (e: { progress: number; velocity: number }) => {
      scrollStore.globalProgress = e.progress;
      scrollStore.scrollVelocity = e.velocity;
      scrollStore._notify(e.progress);
    });

    // Drive lenis from GSAP's ticker (no duplicate RAF loops)
    gsap.ticker.add((time) => {
      l.raf(time * 1000);
    });

    gsap.ticker.lagSmoothing(0);

    setLenis(l);

    return () => {
      l.destroy();
    };
  }, []);

  return (
    <LenisContext.Provider value={lenis}>
      {children}
    </LenisContext.Provider>
  );
}
