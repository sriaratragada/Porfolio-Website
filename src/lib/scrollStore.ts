// ── Shared scroll state ───────────────────────────────────────────────────────
// Plain JS object — GSAP/Lenis writes here, R3F useFrame reads without
// triggering React re-renders.
// ─────────────────────────────────────────────────────────────────────────────

export const scrollStore = {
  globalProgress: 0,   // 0 → 1 over entire page
  scrollVelocity: 0,
};

// ── Phase configuration ───────────────────────────────────────────────────────
// Phase 0: Manhattan city zoom-in
// Phase 1: Battle Bus — flows in from the Manhattan sky
// Phase 2: Dragon — fantasy environment orbit
// Phase 3: Anime sky — camera drift inside a skybox
// Phase 4: Above clouds — 360 skybox orbit
// Phase 5: Enchanted forest — 360 skybox orbit
// Phase 6: Star Destroyer hangar — 360 environment orbit
export const PHASES = [
  { id: 'manhattan', start: 0.00, end: 0.14 },
  { id: 'battlebus', start: 0.14, end: 0.28 },
  { id: 'dragon',    start: 0.28, end: 0.42 },
  { id: 'anime-sky', start: 0.42, end: 0.56 },
  { id: 'clouds',    start: 0.56, end: 0.70 },
  { id: 'forest',    start: 0.70, end: 0.84 },
  { id: 'hangar',    start: 0.84, end: 1.00 },
] as const;

// Transition center points (where the black flash peaks)
export const TRANSITIONS = [0.14, 0.28, 0.42, 0.56, 0.70, 0.84];

// ── Helper: compute opacity for a phase element ────────────────────────────
// Returns 0→1→0 as globalProgress moves through the phase.
// Uses smoothstep (3t²−2t³) for a clean S-curve instead of a linear ramp —
// eliminates the visible "pop" at the start and end of transitions.
export function phaseOpacity(phaseIndex: number, globalProgress: number, fadeSize = 0.05): number {
  const phase = PHASES[phaseIndex];
  const gp = globalProgress;

  if (gp <= phase.start || gp >= phase.end) return 0;

  const fadeIn  = (gp - phase.start) / fadeSize;
  const fadeOut = (phase.end - gp)   / fadeSize;
  const t = Math.min(1, Math.min(fadeIn, fadeOut));
  // Smoothstep: eliminates the hard linear edge
  return t * t * (3 - 2 * t);
}

// ── Helper: phaseProgress 0→1 within a given phase ────────────────────────
export function phaseProgress(phaseIndex: number, globalProgress: number): number {
  const phase = PHASES[phaseIndex];
  if (globalProgress <= phase.start) return 0;
  if (globalProgress >= phase.end)   return 1;
  return (globalProgress - phase.start) / (phase.end - phase.start);
}
