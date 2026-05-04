'use client';

// ── Post-Processing ───────────────────────────────────────────────────────────
// Bloom: subtle glow on bright model surfaces (eyes, metals, emissives).
// Vignette: cinematic dark edges — stronger than before since we're portrait mode.
// Chromatic aberration: off. Glitch: removed entirely.
// ─────────────────────────────────────────────────────────────────────────────

import {
  EffectComposer,
  Bloom,
  Vignette,
} from '@react-three/postprocessing';

export default function PostProcessingEffects() {
  return (
    <EffectComposer>
      {/* Selective bloom — only very bright spots (metal catches, eyes) glow */}
      <Bloom
        intensity={0.25}
        luminanceThreshold={0.85}
        luminanceSmoothing={0.9}
        mipmapBlur
      />
      {/* Cinematic vignette — corners are dark, focus stays on center model */}
      <Vignette eskil={false} offset={0.12} darkness={0.85} />
    </EffectComposer>
  );
}
