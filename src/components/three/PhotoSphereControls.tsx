'use client';

// ── PhotoSphereControls ───────────────────────────────────────────────────────
// Fixed HTML overlay that appears during phases 4 and 5 (photo-sphere GLBs).
// Captures pointer / touch drag and updates photoSphereStore so CameraController
// can rotate the look direction in real time — Google-Maps-Street-View style.
//
// Design decisions:
//   • Overlay is always mounted but hidden (display:none) outside phases 4-5,
//     so there is no React re-render cost during the rest of the portfolio.
//   • Visibility is toggled by a GSAP ticker callback that reads scrollStore —
//     same lightweight pattern used elsewhere in the project.
//   • touchAction:'pan-y' lets vertical swipes still scroll the page on mobile
//     while horizontal swipes rotate the azimuth.
//   • setPointerCapture keeps drag reliable across the full viewport.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { scrollStore, PHASES } from '@/lib/scrollStore';
import { photoSphereStore } from '@/lib/photoSphereStore';

const PHOTO_START = PHASES[4].start;
const PHOTO_END   = PHASES[5].end;

const MAX_ELEVATION = Math.PI * 0.35; // ±63° — avoids gimbal-lock at poles

export default function PhotoSphereControls() {
  const overlayRef     = useRef<HTMLDivElement>(null);
  const hintRef        = useRef<HTMLDivElement>(null);
  const dragRef        = useRef({ active: false, lastX: 0, lastY: 0 });
  const hasInteracted  = useRef(false);

  // ── Show / hide overlay based on scroll phase ──────────────────────────────
  useEffect(() => {
    const tick = () => {
      if (!overlayRef.current) return;
      const inPhotoSphere =
        scrollStore.globalProgress >= PHOTO_START &&
        scrollStore.globalProgress <  PHOTO_END;
      overlayRef.current.style.display = inPhotoSphere ? 'block' : 'none';
    };
    gsap.ticker.add(tick);
    return () => gsap.ticker.remove(tick);
  }, []);

  // ── Drag helpers ───────────────────────────────────────────────────────────
  function startDrag(el: HTMLElement, clientX: number, clientY: number, pointerId: number) {
    el.setPointerCapture(pointerId);
    dragRef.current = { active: true, lastX: clientX, lastY: clientY };
    photoSphereStore.isDragging = true;
    el.style.cursor = 'grabbing';

    if (!hasInteracted.current) {
      hasInteracted.current = true;
      if (hintRef.current) gsap.to(hintRef.current, { opacity: 0, duration: 0.4 });
    }
  }

  function applyDrag(clientX: number, clientY: number) {
    if (!dragRef.current.active) return;
    const dx = clientX - dragRef.current.lastX;
    const dy = clientY - dragRef.current.lastY;
    dragRef.current.lastX = clientX;
    dragRef.current.lastY = clientY;

    // Horizontal drag → azimuth (positive dx = look right → azimuth increases)
    photoSphereStore.userAzDelta += dx * 0.005;

    // Vertical drag → elevation (positive dy = drag down → look down → elevation decreases)
    const newEl = photoSphereStore.userElDelta - dy * 0.003;
    photoSphereStore.userElDelta = Math.max(-MAX_ELEVATION, Math.min(MAX_ELEVATION, newEl));
  }

  function endDrag(el: HTMLElement) {
    dragRef.current.active  = false;
    photoSphereStore.isDragging = false;
    el.style.cursor = 'grab';
  }

  return (
    <div
      ref={overlayRef}
      style={{
        position:      'fixed',
        inset:         0,
        zIndex:        15,   // above canvas (z-0), below text panels (z-20)
        cursor:        'grab',
        display:       'none',
        touchAction:   'pan-y', // vertical scroll still works on mobile
      }}
      onPointerDown={(e) => startDrag(e.currentTarget, e.clientX, e.clientY, e.pointerId)}
      onPointerMove={(e) => applyDrag(e.clientX, e.clientY)}
      onPointerUp={(e)   => endDrag(e.currentTarget)}
      onPointerLeave={(e) => endDrag(e.currentTarget)}
      onPointerCancel={(e) => endDrag(e.currentTarget)}
    >
      {/* "Drag to explore" hint — fades on first interaction */}
      <div
        ref={hintRef}
        style={{
          position:        'absolute',
          bottom:          '90px',
          left:            '50%',
          transform:       'translateX(-50%)',
          display:         'flex',
          flexDirection:   'column',
          alignItems:      'center',
          gap:             '6px',
          pointerEvents:   'none',
          userSelect:      'none',
        }}
      >
        {/* Circular arrows icon */}
        <svg
          width="28" height="28" viewBox="0 0 24 24" fill="none"
          stroke="rgba(240,240,240,0.55)" strokeWidth="1.5"
          strokeLinecap="round" strokeLinejoin="round"
        >
          <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
          <path d="M3 3v5h5" />
        </svg>
        <span
          style={{
            fontFamily:     'var(--font-bebas)',
            fontSize:       '11px',
            letterSpacing:  '0.2em',
            color:          'rgba(240,240,240,0.55)',
            whiteSpace:     'nowrap',
          }}
        >
          DRAG TO EXPLORE
        </span>
      </div>
    </div>
  );
}
