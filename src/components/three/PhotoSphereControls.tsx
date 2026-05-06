'use client';

// ── Photo Sphere Controls ─────────────────────────────────────────────────────
// Active during phases 4 (Above Clouds) and 5 (Enchanted Forest).
// • Pointer drag rotates the view; release applies inertia that decays over time.
// • Cursor is updated via scrollStore subscriber — no polling interval.
// • Auto-drift when idle.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { scrollStore, PHASES } from '@/lib/scrollStore';
import { photoSphereStore } from '@/lib/photoSphereStore';

const DRAG_SPEED  = 0.005;
const AUTO_ROTATE = 0.018; // radians/sec when idle
const INERTIA_DECAY = 0.88; // per-frame multiplier on velocity (frame-rate normalised below)

// Phases 3 (Jungle), 4 (Clouds), 5 (Forest) are photo spheres
function inPhotoPhase(): boolean {
  const gp = scrollStore.globalProgress;
  return gp >= PHASES[3].start && gp < PHASES[6].start;
}

export default function PhotoSphereControls() {
  const { gl } = useThree();

  const dragging  = useRef(false);
  const lastX     = useRef(0);
  const lastY     = useRef(0);
  const velX      = useRef(0); // azimuth velocity (radians/frame)
  const velY      = useRef(0); // elevation velocity (radians/frame)

  // ── Cursor update via subscriber (replaces setInterval polling) ──────────
  useEffect(() => {
    const canvas = gl.domElement;

    const updateCursor = (gp: number) => {
      const active = gp >= PHASES[4].start && gp < PHASES[6].start;
      if (!dragging.current) {
        canvas.style.cursor = active ? 'grab' : '';
      }
    };

    // Subscribe to scroll events — instant, no polling lag
    const unsubscribe = scrollStore.subscribe(updateCursor);
    // Set initial cursor state based on current progress
    updateCursor(scrollStore.globalProgress);

    return unsubscribe;
  }, [gl]);

  // ── Pointer events ───────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = gl.domElement;

    function onDown(e: PointerEvent) {
      if (!inPhotoPhase()) return;
      dragging.current = true;
      lastX.current    = e.clientX;
      lastY.current    = e.clientY;
      velX.current     = 0;
      velY.current     = 0;
      canvas.setPointerCapture(e.pointerId);
      canvas.style.cursor = 'grabbing';
    }

    function onMove(e: PointerEvent) {
      if (!dragging.current) return;
      const dx = e.clientX - lastX.current;
      const dy = e.clientY - lastY.current;
      lastX.current = e.clientX;
      lastY.current = e.clientY;

      // Accumulate velocity for inertia
      velX.current = -dx * DRAG_SPEED;
      velY.current = -dy * DRAG_SPEED;

      photoSphereStore.azimuth  -= dx * DRAG_SPEED;
      photoSphereStore.elevation = THREE.MathUtils.clamp(
        photoSphereStore.elevation - dy * DRAG_SPEED,
        -Math.PI * 0.35,
         Math.PI * 0.35,
      );
    }

    function onUp() {
      dragging.current    = false;
      canvas.style.cursor = inPhotoPhase() ? 'grab' : '';
      // velX/velY are intentionally kept — inertia coasts from here
    }

    canvas.addEventListener('pointerdown',   onDown);
    window.addEventListener('pointermove',   onMove);
    window.addEventListener('pointerup',     onUp);
    window.addEventListener('pointercancel', onUp);

    return () => {
      canvas.removeEventListener('pointerdown',   onDown);
      window.removeEventListener('pointermove',   onMove);
      window.removeEventListener('pointerup',     onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, [gl]);

  // ── Per-frame: inertia decay + auto-drift ───────────────────────────────
  useFrame((_, delta) => {
    if (!inPhotoPhase()) return;

    if (dragging.current) return; // drag handled synchronously in onMove

    // Inertia: apply stored velocity then decay it
    if (Math.abs(velX.current) > 0.00001 || Math.abs(velY.current) > 0.00001) {
      photoSphereStore.azimuth  += velX.current;
      photoSphereStore.elevation = THREE.MathUtils.clamp(
        photoSphereStore.elevation + velY.current,
        -Math.PI * 0.35,
         Math.PI * 0.35,
      );
      // Decay normalised to 60 fps so feel is consistent at any frame rate
      const decayFactor = Math.pow(INERTIA_DECAY, delta * 60);
      velX.current *= decayFactor;
      velY.current *= decayFactor;
    } else {
      // Auto-drift when fully idle
      photoSphereStore.azimuth += delta * AUTO_ROTATE;
    }
  });

  return null;
}
