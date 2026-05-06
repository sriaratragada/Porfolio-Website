'use client';
'use no memo';

// ── Cinematic Camera Controller (v2) ──────────────────────────────────────────
// Data-driven: reads PhaseConfig from phaseController and dispatches to one
// of three reusable camera strategies (crane, orbit, photosphere).
//
// Also runs the phase state update at priority -100 (replaces the old
// SceneManagerUpdater component).
// ─────────────────────────────────────────────────────────────────────────────

import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { scrollStore, phaseProgress } from '@/lib/scrollStore';
import {
  sceneManager,
  updatePhase,
  PHASE_CONFIGS,
  type CraneDiveParams,
  type OrbitParams,
  type PhotosphereParams,
} from '@/lib/phaseController';
import { photoSphereStore } from '@/lib/photoSphereStore';

// ── Scratch vectors (reused every frame to avoid allocation) ────────────────
const _pos  = new THREE.Vector3();
const _look = new THREE.Vector3();

// ── Camera strategy: Crane Dive ─────────────────────────────────────────────
// Smooth ease-in-out from startPos → endPos, looking at a fixed point.

const _start = new THREE.Vector3();
const _end   = new THREE.Vector3();

function applyCraneDive(
  camera: THREE.Camera,
  cfg: CraneDiveParams,
  progress: number,
  delta: number,
) {
  // Ease in-out (quadratic)
  const t = progress < 0.5
    ? 2 * progress * progress
    : 1 - Math.pow(-2 * progress + 2, 2) / 2;

  _start.set(...cfg.startPos);
  _end.set(...cfg.endPos);
  _pos.lerpVectors(_start, _end, t);
  camera.position.lerp(_pos, 9 * delta);
  camera.lookAt(...cfg.lookAt);
  setFov(camera, cfg.fov, delta);
}

// ── Camera strategy: Orbit ──────────────────────────────────────────────────
// Sweeps an arc around an origin point. Optionally descends Y.

function applyOrbit(
  camera: THREE.Camera,
  cfg: OrbitParams,
  progress: number,
  delta: number,
) {
  const eased = 1 - Math.pow(1 - progress, 2.5);
  const angle = THREE.MathUtils.lerp(cfg.angleStart, cfg.angleEnd, eased);

  let y = cfg.y;
  if (cfg.descendingY && cfg.yStart !== undefined && cfg.yEnd !== undefined) {
    // Use same easing for descending orbit
    const eased2 = progress < 0.5
      ? 2 * progress * progress
      : 1 - Math.pow(-2 * progress + 2, 2) / 2;
    y = THREE.MathUtils.lerp(cfg.yStart, cfg.yEnd, eased2);
  }

  let r = cfg.radius;
  if (cfg.radiusStart !== undefined && cfg.radiusEnd !== undefined) {
    // Use the same ease-out for radius expansion
    r = THREE.MathUtils.lerp(cfg.radiusStart, cfg.radiusEnd, eased);
  }

  _pos.set(
    cfg.origin[0] + Math.sin(angle) * r,
    cfg.origin[1] + y,
    cfg.origin[2] + Math.cos(angle) * r,
  );

  camera.position.lerp(_pos, cfg.lerpSpeed * delta);
  camera.lookAt(cfg.origin[0], cfg.origin[1] + cfg.lookY, cfg.origin[2]);
  setFov(camera, cfg.fov, delta);
}

// ── Camera strategy: Photosphere ────────────────────────────────────────────
// Camera sits at the sphere centre, looks in direction driven by
// photoSphereStore (drag / inertia / auto-rotate).

function applyPhotosphere(
  camera: THREE.Camera,
  cfg: PhotosphereParams,
  phase: number,
  progress: number,
  delta: number,
) {
  const store = photoSphereStore[phase];
  if (!store) return;

  const centre = _pos.set(...cfg.centre);
  
  // Slowly rotate the camera 180 degrees over the course of the phase scroll
  // The user's drag (`store.azimuth`) offsets this base rotation.
  const baseAz = progress * Math.PI;
  const az = baseAz + store.azimuth;
  const el = store.elevation;

  _look.set(
    Math.sin(az) * Math.cos(el),
    Math.sin(el),
    Math.cos(az) * Math.cos(el),
  ).multiplyScalar(10).add(centre);

  camera.position.lerp(centre, 8 * delta);
  camera.lookAt(_look);
  setFov(camera, cfg.fov, delta);
}

// ── FOV helper ──────────────────────────────────────────────────────────────
function setFov(camera: THREE.Camera, fov: number, delta: number) {
  if (!(camera instanceof THREE.PerspectiveCamera)) return;
  camera.fov = THREE.MathUtils.lerp(camera.fov, fov, 4 * delta);
  camera.updateProjectionMatrix();
}

// ── Fog helper ──────────────────────────────────────────────────────────────
function setFogDensity(fog: THREE.FogExp2 | null, density: number, delta: number) {
  if (!fog) return;
  fog.density = THREE.MathUtils.lerp(fog.density, density, delta);
}

// ── Photosphere centres for instant teleport on phase entry ─────────────────
function getPhotosphereCentre(phase: number): THREE.Vector3 | null {
  const cfg = PHASE_CONFIGS[phase]?.camera;
  if (cfg?.type !== 'photosphere') return null;
  return _pos.set(...cfg.centre);
}

// ── Component ───────────────────────────────────────────────────────────────

export default function CameraController() {
  const { camera, scene } = useThree();
  const fogRef = useRef<THREE.FogExp2 | null>(null);
  const prevPhase = useRef(-1);

  useEffect(() => {
    fogRef.current = scene.fog instanceof THREE.FogExp2 ? scene.fog : null;
  }, [scene]);

  // ── Priority -100: update phase state BEFORE everything else ──────────────
  useFrame(() => {
    updatePhase(scrollStore.globalProgress);
  }, -100);

  // ── Priority 0 (default): apply camera based on active phase config ───────
  useFrame((_, delta) => {
    const gp    = scrollStore.globalProgress;
    const phase = sceneManager.activePhase;
    const fog   = fogRef.current;
    const cfg   = PHASE_CONFIGS[phase]?.camera;
    if (!cfg) return;

    // Instant teleport when entering a photosphere phase
    if (phase !== prevPhase.current) {
      const centre = getPhotosphereCentre(phase);
      if (centre) camera.position.copy(centre);
      prevPhase.current = phase;
    }

    // Compute progress within the current phase
    const pp = phaseProgress(phase, gp);

    // Dispatch to the correct camera strategy
    switch (cfg.type) {
      case 'crane':
        applyCraneDive(camera, cfg, pp, delta);
        break;
      case 'orbit':
        applyOrbit(camera, cfg, pp, delta);
        break;
      case 'photosphere':
        applyPhotosphere(camera, cfg, phase, pp, delta);
        break;
    }

    // Animate fog density toward the phase target
    setFogDensity(fog, cfg.fogDensity, 8 * delta);
  });

  return null;
}
