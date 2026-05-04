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
// Phase 2: Symbiote  — Spider-Man black suit turntable
// Phase 3: Gojo      — Satoru Gojo, Shinjuku battle
export const PHASES = [
  { id: 'manhattan', start: 0.00, end: 0.22 },
  { id: 'battlebus', start: 0.22, end: 0.47 },
  { id: 'symbiote',  start: 0.47, end: 0.73 },
  { id: 'gojo',      start: 0.73, end: 1.00 },
] as const;

// Transition center points (where the black flash peaks)
export const TRANSITIONS = [0.22, 0.47, 0.73];

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
