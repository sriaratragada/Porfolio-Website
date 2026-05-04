// ── Shared scroll state ───────────────────────────────────────────────────────
// Plain JS object — GSAP/Lenis writes here, R3F useFrame reads without
// triggering React re-renders.
// ─────────────────────────────────────────────────────────────────────────────

export const scrollStore = {
  globalProgress: 0,   // 0 → 1 over entire page
  scrollVelocity: 0,
};

// ── Phase configuration ───────────────────────────────────────────────────────
// 4 cinematic phases mapped to globalProgress 0 → 1
// Change start/end here to adjust pacing (all other code reads PHASES).
export const PHASES = [
  { id: 'manhattan', start: 0.00, end: 0.22 }, // City zoom-in intro
  { id: 'symbiote',  start: 0.22, end: 0.47 }, // Spider-Man symbiote suit
  { id: 'classic',   start: 0.47, end: 0.73 }, // Spider-Man classic MCU
  { id: 'luke',      start: 0.73, end: 1.00 }, // Luke Skywalker
] as const;

// Transition center points (where the black flash peaks)
export const TRANSITIONS = [0.22, 0.47, 0.73];

// ── Helper: compute opacity for a phase element ────────────────────────────
// Returns 0→1→0 as globalProgress moves through the phase.
// FADE_SIZE: fraction of total scroll used for fade-in and fade-out.
export function phaseOpacity(phaseIndex: number, globalProgress: number, fadeSize = 0.035): number {
  const phase = PHASES[phaseIndex];
  const gp = globalProgress;

  if (gp <= phase.start || gp >= phase.end) return 0;

  const fadeIn  = (gp - phase.start) / fadeSize;
  const fadeOut = (phase.end - gp) / fadeSize;

  return Math.min(1, Math.min(fadeIn, fadeOut));
}

// ── Helper: phaseProgress 0→1 within a given phase ────────────────────────
export function phaseProgress(phaseIndex: number, globalProgress: number): number {
  const phase = PHASES[phaseIndex];
  if (globalProgress <= phase.start) return 0;
  if (globalProgress >= phase.end)   return 1;
  return (globalProgress - phase.start) / (phase.end - phase.start);
}
