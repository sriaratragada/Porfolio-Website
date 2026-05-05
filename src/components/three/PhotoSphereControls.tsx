'use client';

import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { scrollStore, PHASES } from '@/lib/scrollStore';
import { photoSphereStore } from '@/lib/photoSphereStore';

const DRAG_SPEED  = 0.005;
const AUTO_ROTATE = 0.018; // radians/sec slow drift when idle

function inPhotoPhase() {
  const gp = scrollStore.globalProgress;
  return gp >= PHASES[4].start && gp < PHASES[6].start;
}

export default function PhotoSphereControls() {
  const { gl } = useThree();
  const dragging = useRef(false);
  const lastX    = useRef(0);
  const lastY    = useRef(0);

  useEffect(() => {
    const canvas = gl.domElement;

    function onDown(e: PointerEvent) {
      if (!inPhotoPhase()) return;
      dragging.current = true;
      lastX.current    = e.clientX;
      lastY.current    = e.clientY;
      canvas.setPointerCapture(e.pointerId);
      canvas.style.cursor = 'grabbing';
    }

    function onMove(e: PointerEvent) {
      if (!dragging.current) return;
      const dx = e.clientX - lastX.current;
      const dy = e.clientY - lastY.current;
      lastX.current = e.clientX;
      lastY.current = e.clientY;
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
    }

    function onEnterPhase() {
      if (inPhotoPhase()) canvas.style.cursor = 'grab';
    }

    canvas.addEventListener('pointerdown',   onDown);
    window.addEventListener('pointermove',   onMove);
    window.addEventListener('pointerup',     onUp);
    window.addEventListener('pointercancel', onUp);

    // Poll for phase entry to update cursor
    const interval = setInterval(onEnterPhase, 200);

    return () => {
      canvas.removeEventListener('pointerdown',   onDown);
      window.removeEventListener('pointermove',   onMove);
      window.removeEventListener('pointerup',     onUp);
      window.removeEventListener('pointercancel', onUp);
      clearInterval(interval);
    };
  }, [gl]);

  // Auto-drift when not dragging
  useFrame((_, delta) => {
    if (!inPhotoPhase() || dragging.current) return;
    photoSphereStore.azimuth += delta * AUTO_ROTATE;
  });

  return null;
}
