// ── Scene Manager ─────────────────────────────────────────────────────────────
// Single authoritative "what's visible this frame" state.
// Updated once per frame by SceneManagerUpdater inside the R3F Canvas.
// Read by CameraController, SceneLighting, PostProcessing, etc.
// Plain JS object — no React state, no re-renders.
// ─────────────────────────────────────────────────────────────────────────────

import { PHASES, phaseProgress as computePhaseProgress } from './scrollStore';

export const sceneManager = {
  activePhase:    0,     // 0-6 integer index into PHASES
  phaseProgress:  0,     // 0→1 within the active phase
  inTransition:   false, // true within ±2% of any phase boundary
};

export function updateSceneManager(gp: number): void {
  // Find active phase — last phase whose start <= gp
  let active = PHASES.length - 1;
  for (let i = 0; i < PHASES.length - 1; i++) {
    if (gp < PHASES[i + 1].start) {
      active = i;
      break;
    }
  }

  sceneManager.activePhase   = active;
  sceneManager.phaseProgress = computePhaseProgress(active, gp);

  // Transition zone: ±2% around each boundary
  const ZONE = 0.02;
  sceneManager.inTransition = [0.14, 0.28, 0.42, 0.56, 0.70, 0.84].some(
    b => Math.abs(gp - b) < ZONE,
  );
}
