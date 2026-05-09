'use client';

import { useEffect, useState, createContext, useContext, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { scrollStore } from '@/lib/scrollStore';
import { consumeSavedPortfolioProgress } from '@/lib/portfolioScrollMemory';

gsap.registerPlugin(ScrollTrigger);

const LenisContext = createContext<Lenis | null>(null);

export function useLenis() {
  return useContext(LenisContext);
}

export default function LenisProvider({ children }: { children: ReactNode }) {
  // Use useState so consumers get the live instance, not the null initial value
  const [lenis, setLenis] = useState<Lenis | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    // Prevent browser from restoring scroll position on reload
    history.scrollRestoration = 'manual';
    const restoreProgress = pathname === '/' ? consumeSavedPortfolioProgress() : null;

    window.scrollTo(0, 0);
    scrollStore.globalProgress = 0;
    scrollStore.scrollVelocity = 0;

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
    const tick = (time: number) => {
      l.raf(time * 1000);
    };
    gsap.ticker.add(tick);

    gsap.ticker.lagSmoothing(0);

    setLenis(l);

    if (pathname === '/' && restoreProgress !== null) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
          const targetScroll = maxScroll * restoreProgress;
          l.scrollTo(targetScroll, { immediate: true });
          scrollStore.globalProgress = restoreProgress;
          scrollStore.scrollVelocity = 0;
          scrollStore._notify(restoreProgress);
          ScrollTrigger.update();
        });
      });
    }

    return () => {
      gsap.ticker.remove(tick);
      l.destroy();
    };
  }, [pathname]);

  return (
    <LenisContext.Provider value={lenis}>
      {children}
    </LenisContext.Provider>
  );
}
