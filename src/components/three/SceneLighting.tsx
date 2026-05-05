'use client';

// ── Scene Lighting ────────────────────────────────────────────────────────────
// Phase 0 (Manhattan): moonlight + city glow + red heartbeat.
// Phase 1-3 (Characters): studio portrait lighting — key + rim + fill.
// Smoothly crossfades between the two lighting setups.
// ─────────────────────────────────────────────────────────────────────────────

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { scrollStore, PHASES } from '@/lib/scrollStore';

export default function SceneLighting() {
  const redLightRef    = useRef<THREE.PointLight>(null);
  const blueLightRef   = useRef<THREE.PointLight>(null);
  const keyLightRef    = useRef<THREE.DirectionalLight>(null);
  const fillLightRef   = useRef<THREE.DirectionalLight>(null);
  const rimLightRef    = useRef<THREE.DirectionalLight>(null);

  useFrame(({ clock }, delta) => {
    const t   = clock.elapsedTime;
    const gp  = scrollStore.globalProgress;
    const p0  = PHASES[0];
    // 0=full Manhattan lighting, 1=full character lighting
    const charBlend = Math.max(0, Math.min(1, (gp - p0.start) / (p0.end - p0.start + 0.05)));

    // ── City heartbeat lights (fade out in character phases) ──────
    if (redLightRef.current) {
      redLightRef.current.intensity = (6 + Math.sin(t * 2.1) * 5) * (1 - charBlend);
    }
    if (blueLightRef.current) {
      blueLightRef.current.intensity = (18 + Math.sin(t * 0.6) * 6) * (1 - charBlend);
    }

    // Fade studio lights out during Forest phase (skybox self-illuminates)
    const p5 = PHASES[5];
    const forestBlend = Math.max(0, Math.min(1, (gp - p5.start) / (p5.end - p5.start)));
    const studioScale = charBlend * (1 - forestBlend);

    // ── Character studio lights (fade in as characters appear, out for Forest) ─
    if (keyLightRef.current) {
      keyLightRef.current.intensity = THREE.MathUtils.damp(
        keyLightRef.current.intensity,
        6.5 * studioScale,
        5, delta
      );
    }
    if (fillLightRef.current) {
      fillLightRef.current.intensity = THREE.MathUtils.damp(
        fillLightRef.current.intensity,
        3.2 * studioScale,
        5, delta
      );
    }
    if (rimLightRef.current) {
      rimLightRef.current.intensity = THREE.MathUtils.damp(
        rimLightRef.current.intensity,
        5.0 * studioScale,
        5, delta
      );
    }
  });

  return (
    <>
      {/* ── Always-on ambient — brighter so models are never too dark ── */}
      <ambientLight color={0x1a1e38} intensity={7} />

      {/* ── Manhattan phase lighting ── */}

      {/* Moonlight — high so it clears building tops at y≈22 */}
      <directionalLight position={[-8, 35, 10]} color={0xd0e8ff} intensity={4.5} />

      {/* Warm building window glow from below right */}
      <directionalLight position={[12, -5, 6]} color={0xffcc88} intensity={1.4} />

      {/* Symbiote red heartbeat — close to Spider-Man */}
      <pointLight
        ref={redLightRef}
        position={[2.5, 4, 5]}
        color={0xff1020}
        intensity={11}
        distance={18}
        decay={2}
      />

      {/* City upward glow — blue-purple haze */}
      <pointLight
        ref={blueLightRef}
        position={[0, -8, -4]}
        color={0x1028a0}
        intensity={24}
        distance={60}
        decay={1.2}
      />

      {/* ── Character studio lighting ── */}

      {/* Key light — strong 3-point key from top-left-front */}
      <directionalLight
        ref={keyLightRef}
        position={[-5, 10, 7]}
        color={0xfff8f0}
        intensity={0}        // starts 0, fades in via useFrame
        castShadow={false}
      />

      {/* Fill light — wide soft fill from the right, brings up shadow side */}
      <directionalLight
        ref={fillLightRef}
        position={[6, 3, 5]}
        color={0xc8d8ff}
        intensity={0}
      />

      {/* Rim / back light — sharp silhouette edge from behind */}
      <directionalLight
        ref={rimLightRef}
        position={[0, 8, -10]}
        color={0x6688ff}
        intensity={0}
      />
    </>
  );
}
