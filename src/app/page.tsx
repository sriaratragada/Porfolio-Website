'use client';

// ── Page ─────────────────────────────────────────────────────────────────────
// Single 500vh scroll container — the whole portfolio is one cinematic journey.
// ContentOverlay reads the scroll element ref to set up ScrollTrigger.
// The 3D canvas (fixed, z-0) is always behind; text overlays in front.
// ─────────────────────────────────────────────────────────────────────────────

import { useRef, useState, useEffect } from 'react';
import ContentOverlay from '@/components/layout/ContentOverlay';

export default function Home() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollEl, setScrollEl] = useState<HTMLElement | null>(null);

  // Pass the scroll element to ContentOverlay once it mounts
  // so ScrollTrigger can target it correctly
  useEffect(() => {
    setScrollEl(scrollRef.current);
  }, []);

  return (
    <>
      {/* 900vh — each of the 4 phases gets ~225vh of comfortable scroll travel */}
      <div ref={scrollRef} style={{ height: '900vh' }} />

      {/* Fixed overlay: text panels + transition flashes + letterbox bars */}
      <ContentOverlay scrollEl={scrollEl} />
    </>
  );
}
