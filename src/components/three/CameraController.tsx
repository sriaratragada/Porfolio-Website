'use client';
'use no memo';

// ── Cinematic Camera Controller ───────────────────────────────────────────────
// Phase 0 — Manhattan:  wide crane shot diving into the city
// Phase 1 — Bus:        180° orbit around the bus, sky sphere as backdrop
// Phase 2 — Track:      120° orbit closing in on the race track
// Phase 3 — Jungle:     360° photo sphere at world origin, mouse-look
// Phase 4 — Clouds:     360° photo sphere at X+1000, mouse-look
// Phase 5 — Forest:     360° photo sphere at X+2000, mouse-look
// Phase 6 — Hangar:     slow 360° orbit at X+3000
//
// Each photo sphere lives at a unique world position — fully independent,
// no shared depth-buffer conflicts with transparent materials.
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
const BUS_ORBIT_RADIUS = 2.75;   // wider orbit for a cinematic view
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

// ── Phase 3 — Jungle photo sphere ─ world position (0, 0, 0) ─────────────────
const JUNGLE_FOV = 72;
const JUNGLE_CAM = new THREE.Vector3(0, 0.5, 0);

// ── Phase 4 — Above Clouds ── world position (1000, 0, 0) ────────────────────
const CLOUD_FOV = 76;
const CLOUD_CAM = new THREE.Vector3(1000, 0.5, 0);

// ── Phase 5 — Enchanted Forest ── world position (2000, 0, 0) ────────────────
const FOREST_FOV = 70;
const FOREST_CAM = new THREE.Vector3(2000, 0.5, 0);

// ── Phase 6 — Star Destroyer Hangar ── world position (3000, 0, 0) ───────────
const HANGAR_ORBIT_RADIUS = 6.0;
const HANGAR_ORBIT_Y = 4.0;
const HANGAR_LOOK_Y = 3.1;
const HANGAR_ANGLE_START = Math.PI * 0.85;
const HANGAR_ANGLE_END = HANGAR_ANGLE_START - Math.PI * 1.05;
const HANGAR_FOV = 64;
const HANGAR_ORIGIN = new THREE.Vector3(3000, 0, 0);

const _pos = new THREE.Vector3();
const _look = new THREE.Vector3();

// Instant-teleport targets for each photo-sphere phase — used on phase entry
const PHOTO_CENTRES: Readonly<Record<number, THREE.Vector3>> = {
  3: JUNGLE_CAM,
  4: CLOUD_CAM,
  5: FOREST_CAM,
};

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
  origin: THREE.Vector3,
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
    origin.x + Math.sin(angle) * radius,
    origin.y + y,
    origin.z + Math.cos(angle) * radius,
  );

  camera.position.lerp(_pos, lerpSpeed * delta);
  camera.lookAt(origin.x, origin.y + lookY, origin.z);
  setFov(camera, fov, delta);
}

// Build lookAt target from azimuth/elevation relative to a sphere centre
function photoLookAt(
  camera: THREE.Camera,
  centre: THREE.Vector3,
  phase: number,
  delta: number,
  fov: number,
) {
  const store = photoSphereStore[phase];
  if (!store) return;
  const az = store.azimuth;
  const el = store.elevation;
  _look.set(
    Math.sin(az) * Math.cos(el),
    Math.sin(el),
    Math.cos(az) * Math.cos(el),
  ).multiplyScalar(10).add(centre);
  camera.position.lerp(centre, 8 * delta);
  camera.lookAt(_look);
  setFov(camera, fov, delta);
}

export default function CameraController() {
  const { camera, scene } = useThree();
  const fogRef = useRef<THREE.FogExp2 | null>(null);
  const prevPhase = useRef(-1);

  useEffect(() => {
    fogRef.current = scene.fog instanceof THREE.FogExp2 ? scene.fog : null;
  }, [scene]);

  useFrame((_, delta) => {
    const gp = scrollStore.globalProgress;
    const phase = sceneManager.activePhase;
    const fog = fogRef.current;

    // ── Instant camera teleport when entering a photo-sphere phase ───────────
    // lerp(8*delta) takes ~0.5s to cover large distances; scrolling fast leaves
    // the camera outside the sphere. Copy position immediately on phase entry.
    if (phase !== prevPhase.current) {
      const centre = PHOTO_CENTRES[phase];
      if (centre) camera.position.copy(centre);
      prevPhase.current = phase;
    }

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
        setOrbitCamera(camera, pp, new THREE.Vector3(0, 0, 0),
          BUS_ORBIT_RADIUS, BUS_ORBIT_Y, BUS_LOOK_Y,
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

      // ── Phase 3: Jungle photo sphere — camera at (0, 0.5, 0) ────────────────
      case 3: {
        photoLookAt(camera, JUNGLE_CAM, 3, delta, JUNGLE_FOV);
        setFogDensity(fog, 0.00008, 10 * delta);
        break;
      }

      // ── Phase 4: Above Clouds photo sphere — camera at (1000, 0.5, 0) ───────
      case 4: {
        photoLookAt(camera, CLOUD_CAM, 4, delta, CLOUD_FOV);
        setFogDensity(fog, 0.00008, 10 * delta);
        break;
      }

      // ── Phase 5: Enchanted Forest photo sphere — camera at (2000, 0.5, 0) ───
      case 5: {
        photoLookAt(camera, FOREST_CAM, 5, delta, FOREST_FOV);
        setFogDensity(fog, 0.00012, 10 * delta);
        break;
      }

      // ── Phase 6: Star Destroyer Hangar — orbit at (3000, 0, 0) ─────────────
      default: {
        const pp = phaseProgress(6, gp);
        setOrbitCamera(camera, pp, HANGAR_ORIGIN,
          HANGAR_ORBIT_RADIUS, HANGAR_ORBIT_Y, HANGAR_LOOK_Y,
          HANGAR_ANGLE_START, HANGAR_ANGLE_END, HANGAR_FOV, delta, 2.4);
        setFogDensity(fog, 0.00008, 10 * delta);
        break;
      }
    }
  });

  return null;
}
