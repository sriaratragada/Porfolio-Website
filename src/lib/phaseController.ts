// ── Phase Controller ──────────────────────────────────────────────────────────
// Single source of truth for "what phase are we in, what progress, what camera".
//
// Replaces the old sceneManager.ts — but re-exports the same `sceneManager`
// object so SceneLighting, PostProcessing etc. continue working unmodified.
//
// The phase config registry lives here: each phase declares its camera strategy,
// world origin, and all camera parameters. CameraController reads this config
// instead of hard-coding constants.
// ─────────────────────────────────────────────────────────────────────────────

import { PHASES, phaseProgress as computePhaseProgress } from './scrollStore';

// ── Camera strategy types ───────────────────────────────────────────────────

export interface CraneDiveParams {
  type: 'crane';
  startPos: [number, number, number];
  endPos: [number, number, number];
  lookAt: [number, number, number];
  fov: number;
  fogDensity: number;
}

export interface OrbitParams {
  type: 'orbit';
  origin: [number, number, number];
  radius: number;
  y: number;
  lookY: number;
  angleStart: number;
  angleEnd: number;
  fov: number;
  lerpSpeed: number;
  fogDensity: number;
  /** If true, Y descends from yStart→yEnd over the orbit */
  descendingY?: boolean;
  yStart?: number;
  yEnd?: number;
  /** If provided, radius interpolates from radiusStart→radiusEnd */
  radiusStart?: number;
  radiusEnd?: number;
}

export interface PhotosphereParams {
  type: 'photosphere';
  centre: [number, number, number];
  fov: number;
  fogDensity: number;
}

export type CameraParams = CraneDiveParams | OrbitParams | PhotosphereParams;

export interface PhaseConfig {
  id: string;
  camera: CameraParams;
}

// ── Phase config registry ───────────────────────────────────────────────────

export const PHASE_CONFIGS: readonly PhaseConfig[] = [
  // Phase 0 — Manhattan: crane dive
  {
    id: 'manhattan',
    camera: {
      type: 'crane',
      startPos: [-2, 8, 17],
      endPos: [0, 3, 1],
      lookAt: [-2, 4, 0],
      fov: 68,
      fogDensity: 0.018,
    },
  },
  // Phase 1 — Battle Bus: 180° orbit
  {
    id: 'battlebus',
    camera: {
      type: 'orbit',
      origin: [0, 0, 0],
      radius: 2.75,
      y: 3.0,
      lookY: 2.5,
      angleStart: Math.PI * 0.65,
      angleEnd: -Math.PI * 0.35,
      fov: 62,
      lerpSpeed: 3.5,
      fogDensity: 0.002,
    },
  },
  // Phase 2 — Race Track: 120° sweeping orbit, descending camera
  {
    id: 'track',
    camera: {
      type: 'orbit',
      origin: [0, 0, 0],
      radius: 20,
      y: 10.0,          // ignored when descendingY is true
      lookY: 2.0,
      angleStart: Math.PI * 0.55,
      angleEnd: -Math.PI * 0.10,
      fov: 58,
      lerpSpeed: 3.0,
      fogDensity: 0.001,
      descendingY: true,
      yStart: 10.0,
      yEnd: 3.5,
    },
  },
  // Phase 3 — Jungle: 360° photosphere at (0, 0, 0)
  {
    id: 'jungle',
    camera: {
      type: 'photosphere',
      centre: [0, 0.5, 0],
      fov: 72,
      fogDensity: 0.00008,
    },
  },
  // Phase 4 — Above Clouds: 360° photosphere at (1000, 0, 0)
  {
    id: 'clouds',
    camera: {
      type: 'photosphere',
      centre: [1000, 0.5, 0],
      fov: 76,
      fogDensity: 0.00008,
    },
  },
  // Phase 5 — Enchanted Forest: 360° photosphere at (2000, 0, 0)
  {
    id: 'forest',
    camera: {
      type: 'photosphere',
      centre: [2000, 0.5, 0],
      fov: 70,
      fogDensity: 0.00012,
    },
  },
  // Phase 6 — Star Destroyer Hangar: slow orbit at (3000, 0, 0)
  {
    id: 'hangar',
    camera: {
      type: 'orbit',
      origin: [3000, 0, 0],
      radius: 6.0,
      radiusStart: 0.25,
      radiusEnd: 7.5,
      y: 4.0,
      lookY: 3.1,
      angleStart: Math.PI * 0.85,
      angleEnd: Math.PI * 0.85 - Math.PI * 1.05,
      fov: 64,
      lerpSpeed: 2.4,
      fogDensity: 0.00008,
    },
  },
] as const;

// ── Scene manager — backward-compatible API ─────────────────────────────────
// SceneLighting, PostProcessing, PhotoSphereControls all read these fields.

export const sceneManager = {
  activePhase: 0,     // 0–6 integer index
  phaseProgress: 0,     // 0→1 within the active phase
  inTransition: false, // true within ±2% of any phase boundary
};

export function updatePhase(gp: number): void {
  // Find active phase — last phase whose start ≤ gp
  let active = PHASES.length - 1;
  for (let i = 0; i < PHASES.length - 1; i++) {
    if (gp < PHASES[i + 1].start) {
      active = i;
      break;
    }
  }

  sceneManager.activePhase = active;
  sceneManager.phaseProgress = computePhaseProgress(active, gp);

  // Transition zone: ±2% around each boundary
  const ZONE = 0.02;
  sceneManager.inTransition = [0.14, 0.28, 0.42, 0.56, 0.70, 0.84].some(
    b => Math.abs(gp - b) < ZONE,
  );
}
