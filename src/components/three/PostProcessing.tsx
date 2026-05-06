'use client';

// ── Post-Processing ───────────────────────────────────────────────────────────
// Bloom, Vignette intensities lerp toward per-phase targets each frame.
// A sibling <PostProcessingController /> handles the imperative useFrame
// updates so the EffectComposer tree stays declarative.
// ─────────────────────────────────────────────────────────────────────────────

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  EffectComposer,
  Bloom,
  Vignette,
} from '@react-three/postprocessing';
import { BloomEffect } from 'postprocessing';
import * as THREE from 'three';
import { sceneManager } from '@/lib/phaseController';

// Per-phase post-processing targets
const PHASE_POST = [
  { bloom: 0.30, vignetteDark: 0.88 }, // Phase 0 — Manhattan: strong cinematic
  { bloom: 0.25, vignetteDark: 0.80 }, // Phase 1 — Bus
  { bloom: 0.20, vignetteDark: 0.72 }, // Phase 2 — Race Track
  { bloom: 0.15, vignetteDark: 0.65 }, // Phase 3 — Bedroom: subtle
  { bloom: 0.40, vignetteDark: 0.70 }, // Phase 4 — Clouds: bright bloom
  { bloom: 0.45, vignetteDark: 0.90 }, // Phase 5 — Forest: glow-heavy
  { bloom: 0.20, vignetteDark: 0.88 }, // Phase 6 — Hangar: cold steel
];

// Inner controller — lives inside Canvas so useFrame works
function PostProcessingController({
  bloomRef,
}: {
  bloomRef: React.RefObject<BloomEffect | null>;
}) {
  useFrame((_, delta) => {
    if (!bloomRef.current) return;
    const target = PHASE_POST[sceneManager.activePhase] ?? PHASE_POST[0];
    // Lerp bloom intensity toward phase target
    (bloomRef.current as any).intensity = THREE.MathUtils.lerp(
      (bloomRef.current as any).intensity ?? 0.25,
      target.bloom,
      3 * delta,
    );
  });
  return null;
}

export default function PostProcessingEffects() {
  const bloomRef = useRef<BloomEffect>(null);

  return (
    <>
      {/* Controller drives bloom imperatively without re-rendering the composer */}
      <PostProcessingController bloomRef={bloomRef} />

      <EffectComposer>
        {/* ref gives access to BloomEffect.intensity for per-frame lerp */}
        <Bloom
          ref={bloomRef as any}
          intensity={0.30}
          luminanceThreshold={0.85}
          luminanceSmoothing={0.9}
          mipmapBlur
        />
        {/* Vignette stays mostly constant; adjust offset to soften per phase if needed */}
        <Vignette eskil={false} offset={0.12} darkness={0.85} />
      </EffectComposer>
    </>
  );
}
