'use client';
'use no memo';

// ── Cinematic Camera Controller ───────────────────────────────────────────────
// Phase 0 — Manhattan:  wide crane shot diving into the city
// Phase 1 — Bus:        180° orbit around the bus, sky sphere as backdrop
// Phase 2 — Track:      120° orbit closing in on the race track
// Phase 3 — Bedroom:    camera orbits inside the bedroom at eye-height
// Phase 4-5 — 360 skyboxes: camera locked inside sphere, photo-sphere mouse-look
// Phase 6 — Hangar:     slow 360° orbit inside the Star Destroyer
//
// Phase guard pattern: check sceneManager.activePhase (integer switch) instead
// of ad-hoc gp comparisons with inconsistent epsilons.
// ─────────────────────────────────────────────────────────────────────────────

import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { scrollStore, phaseProgress } from '@/lib/scrollStore';
import { sceneManager } from '@/lib/sceneManager';
import { photoSphereStore } from '@/lib/photoSphereStore';

// ── Phase 0 — Manhattan crane dive ───────────────────────────────────────────
const MAN_START = new THREE.Vector3(-2, 8, 17);
const MAN_END = new THREE.Vector3(0, 3, 1);

// ── Phase 1 — Bus: 180° orbit ────────────────────────────────────────────────
const BUS_ORBIT_RADIUS = 2.75;
const BUS_ORBIT_Y = 3.0;
const BUS_LOOK_Y = 2.5;
const BUS_ANGLE_START = Math.PI * 0.65;
const BUS_ANGLE_END = -Math.PI * 0.35;
const BUS_FOV = 62;

// ── Phase 2 — Race Track: 120° sweeping orbit, descending camera ─────────────
const TRK_ORBIT_RADIUS = 20;
const TRK_ORBIT_Y_START = 10.0;
const TRK_ORBIT_Y_END = 3.5;
const TRK_LOOK_Y = 2.0;
const TRK_ANGLE_START = Math.PI * 0.55;
const TRK_ANGLE_END = -Math.PI * 0.10;
const TRK_FOV = 58;

// ── Phase 3 — Jungle: 360° photo sphere, mouse-look (same as phases 4-5) ─────
const JUNGLE_FOV = 72;

// ── Phase 4 — Above Clouds: camera inside sphere, mouse-look ─────────────────
const CLOUD_FOV = 76;

// ── Phase 5 — Enchanted Forest: camera inside sphere, mouse-look ─────────────
const FOREST_FOV = 70;

// ── Phase 6 — Star Destroyer Hangar: wide 360° orbit ─────────────────────────
const HANGAR_ORBIT_RADIUS = 6.0;
const HANGAR_ORBIT_Y = 4.0;
const HANGAR_LOOK_Y = 3.1;
const HANGAR_ANGLE_START = Math.PI * 0.85;
const HANGAR_ANGLE_END = HANGAR_ANGLE_START - Math.PI * 1.05;
const HANGAR_FOV = 64;

// Shared at the sphere centre used by photo-sphere phases
const _SPHERE_POS = new THREE.Vector3(0, 0.5, 0);

const _pos = new THREE.Vector3();
const _look = new THREE.Vector3();

function setFov(camera: THREE.Camera, fov: number, delta: number) {
  if (!(camera instanceof THREE.PerspectiveCamera)) return;
  camera.fov = THREE.MathUtils.lerp(camera.fov, fov, 4 * delta);
  camera.updateProjectionMatrix();
}

function setFogDensity(fog: THREE.FogExp2 | null, density: number, delta: number) {
  if (!fog) return;
  fog.density = THREE.MathUtils.lerp(fog.density, density, delta);
}

function setOrbitCamera(
  camera: THREE.Camera,
  progress: number,
  radius: number,
  y: number,
  lookY: number,
  angleStart: number,
  angleEnd: number,
  fov: number,
  delta: number,
  lerpSpeed = 3.0,
) {
  const eased = 1 - Math.pow(1 - progress, 2.5);
  const angle = THREE.MathUtils.lerp(angleStart, angleEnd, eased);

  _pos.set(
    Math.sin(angle) * radius,
    y,
    Math.cos(angle) * radius,
  );

  camera.position.lerp(_pos, lerpSpeed * delta);
  camera.lookAt(0, lookY, 0);
  setFov(camera, fov, delta);
}

export default function CameraController() {
  const { camera, scene } = useThree();
  const fogRef = useRef<THREE.FogExp2 | null>(null);

  useEffect(() => {
    fogRef.current = scene.fog instanceof THREE.FogExp2 ? scene.fog : null;
  }, [scene]);

  useFrame((_, delta) => {
    const gp = scrollStore.globalProgress;
    const phase = sceneManager.activePhase; // authoritative integer phase
    const fog = fogRef.current;

    switch (phase) {
      // ── Phase 0: Manhattan dive ─────────────────────────────────────────────
      case 0: {
        const t = phaseProgress(0, gp);
        const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
        _pos.lerpVectors(MAN_START, MAN_END, eased);
        camera.position.lerp(_pos, 9 * delta);
        camera.lookAt(-2, 4, 0);
        setFov(camera, 68, delta);
        setFogDensity(fog, 0.018, 8 * delta);
        break;
      }

      // ── Phase 1: Bus — orbital sweep ────────────────────────────────────────
      case 1: {
        const pp = phaseProgress(1, gp);
        setOrbitCamera(camera, pp, BUS_ORBIT_RADIUS, BUS_ORBIT_Y, BUS_LOOK_Y,
          BUS_ANGLE_START, BUS_ANGLE_END, BUS_FOV, delta, 3.5);
        setFogDensity(fog, 0.002, 6 * delta);
        break;
      }

      // ── Phase 2: Race Track — sweeping orbit, camera descends ───────────────
      case 2: {
        const pp = phaseProgress(2, gp);
        const eased = pp < 0.5 ? 2 * pp * pp : 1 - Math.pow(-2 * pp + 2, 2) / 2;
        const angle = THREE.MathUtils.lerp(TRK_ANGLE_START, TRK_ANGLE_END, eased);
        const y = THREE.MathUtils.lerp(TRK_ORBIT_Y_START, TRK_ORBIT_Y_END, eased);
        _pos.set(Math.sin(angle) * TRK_ORBIT_RADIUS, y, Math.cos(angle) * TRK_ORBIT_RADIUS);
        camera.position.lerp(_pos, 3.0 * delta);
        camera.lookAt(0, TRK_LOOK_Y, 0);
        setFov(camera, TRK_FOV, delta);
        setFogDensity(fog, 0.001, 8 * delta);
        break;
      }

      // ── Phase 3: Jungle photo sphere — camera at centre, mouse-look ─────────────
      case 3: {
        camera.position.lerp(_SPHERE_POS, 8 * delta);
        const az = photoSphereStore.azimuth;
        const el = photoSphereStore.elevation;
        _look.set(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el))
          .multiplyScalar(10).add(_SPHERE_POS);
        camera.lookAt(_look);
        setFov(camera, JUNGLE_FOV, delta);
        setFogDensity(fog, 0.0002, 10 * delta);
        break;
      }

      // ── Phase 4: Above Clouds — photo sphere, mouse-look ────────────────────
      case 4: {
        camera.position.lerp(_SPHERE_POS, 8 * delta);
        const az = photoSphereStore.azimuth;
        const el = photoSphereStore.elevation;
        _look.set(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el))
          .multiplyScalar(10).add(_SPHERE_POS);
        camera.lookAt(_look);
        setFov(camera, CLOUD_FOV, delta);
        setFogDensity(fog, 0.00015, 10 * delta);
        break;
      }

      // ── Phase 5: Enchanted Forest — photo sphere, mouse-look ────────────────
      case 5: {
        camera.position.lerp(_SPHERE_POS, 8 * delta);
        const az = photoSphereStore.azimuth;
        const el = photoSphereStore.elevation;
        _look.set(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el))
          .multiplyScalar(10).add(_SPHERE_POS);
        camera.lookAt(_look);
        setFov(camera, FOREST_FOV, delta);
        setFogDensity(fog, 0.00035, 10 * delta);
        break;
      }

      // ── Phase 6: Star Destroyer Hangar — wide 360° orbit ────────────────────
      default: {
        const pp = phaseProgress(6, gp);
        setOrbitCamera(camera, pp, HANGAR_ORBIT_RADIUS, HANGAR_ORBIT_Y, HANGAR_LOOK_Y,
          HANGAR_ANGLE_START, HANGAR_ANGLE_END, HANGAR_FOV, delta, 2.4);
        setFogDensity(fog, 0.0002, 10 * delta);
        break;
      }
    }
  });

  return null;
}
