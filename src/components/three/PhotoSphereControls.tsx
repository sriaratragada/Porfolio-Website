'use client';

// ── Photo Sphere Controls ─────────────────────────────────────────────────────
// Active during phases 3 (Jungle), 4 (Clouds), 5 (Forest).
// Each phase has its own azimuth/elevation in photoSphereStore — fully independent.
// Drag → inertia decay → auto-drift when idle.
// Cursor updated via scrollStore subscriber (no polling interval).
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { scrollStore, PHASES } from '@/lib/scrollStore';
import { sceneManager } from '@/lib/sceneManager';
import { photoSphereStore } from '@/lib/photoSphereStore';

const DRAG_SPEED    = 0.005;
const AUTO_ROTATE   = 0.018;  // rad/s idle drift
const INERTIA_DECAY = 0.88;   // per-frame decay factor (normalised to 60fps)

// Phases 3-5 are photo spheres
function inPhotoPhase(): boolean {
  const gp = scrollStore.globalProgress;
  return gp >= PHASES[3].start && gp < PHASES[6].start;
}

export default function PhotoSphereControls() {
  const { gl } = useThree();

  const dragging = useRef(false);
  const lastX    = useRef(0);
  const lastY    = useRef(0);
  const velX     = useRef(0);
  const velY     = useRef(0);

  // ── Cursor via subscriber — no polling ───────────────────────────────────
  useEffect(() => {
    const canvas = gl.domElement;
    const updateCursor = (gp: number) => {
      const active = gp >= PHASES[3].start && gp < PHASES[6].start;
      if (!dragging.current) canvas.style.cursor = active ? 'grab' : '';
    };
    const unsub = scrollStore.subscribe(updateCursor);
    updateCursor(scrollStore.globalProgress);
    return unsub;
  }, [gl]);

  // ── Pointer events ───────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = gl.domElement;

    function onDown(e: PointerEvent) {
      if (!inPhotoPhase()) return;
      dragging.current = true;
      lastX.current = e.clientX;
      lastY.current = e.clientY;
      velX.current  = 0;
      velY.current  = 0;
      canvas.setPointerCapture(e.pointerId);
      canvas.style.cursor = 'grabbing';
    }

    function onMove(e: PointerEvent) {
      if (!dragging.current) return;
      const dx = e.clientX - lastX.current;
      const dy = e.clientY - lastY.current;
      lastX.current = e.clientX;
      lastY.current = e.clientY;

      // Write to the ACTIVE phase's independent store slot
      const phase = sceneManager.activePhase;
      const store = photoSphereStore[phase];
      if (store) {
        velX.current = -dx * DRAG_SPEED;
        velY.current = -dy * DRAG_SPEED;
        store.azimuth  -= dx * DRAG_SPEED;
        store.elevation = THREE.MathUtils.clamp(
          store.elevation - dy * DRAG_SPEED,
          -Math.PI * 0.35,
           Math.PI * 0.35,
        );
      }
    }

    function onUp() {
      dragging.current    = false;
      canvas.style.cursor = inPhotoPhase() ? 'grab' : '';
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

  // ── Per-frame: inertia + auto-drift on active phase store ────────────────
  useFrame((_, delta) => {
    if (!inPhotoPhase() || dragging.current) return;

    const phase = sceneManager.activePhase;
    const store = photoSphereStore[phase];
    if (!store) return;

    if (Math.abs(velX.current) > 0.00001 || Math.abs(velY.current) > 0.00001) {
      store.azimuth  += velX.current;
      store.elevation = THREE.MathUtils.clamp(
        store.elevation + velY.current,
        -Math.PI * 0.35,
         Math.PI * 0.35,
      );
      const decay = Math.pow(INERTIA_DECAY, delta * 60);
      velX.current *= decay;
      velY.current *= decay;
    } else {
      store.azimuth += delta * AUTO_ROTATE;
    }
  });

  return null;
}
