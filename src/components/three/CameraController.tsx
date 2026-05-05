'use client';
'use no memo';

// ── Cinematic Camera Controller ───────────────────────────────────────────────
// Phase 0 — Manhattan: wide crane shot diving into the city
// Phase 1 — Bus:     180° orbit around the bus, sky sphere as backdrop
// Phase 2 — Dragon:  120° orbit closing in on the dragon scene
// Phase 3 — Sky:     camera drifts upward inside the anime skybox
// Phase 4-6 — 360 GLBs: slow Battle Bus-style orbit around later environments
// ─────────────────────────────────────────────────────────────────────────────

import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { scrollStore, PHASES, phaseProgress } from '@/lib/scrollStore';
import { photoSphereStore } from '@/lib/photoSphereStore';

// ── Phase 0 — Manhattan crane dive ───────────────────────────────────────────
const MAN_START = new THREE.Vector3(-2,  8, 17);
const MAN_END   = new THREE.Vector3( 0,  3,  1);

// ── Phase 1 — Bus: 180° orbit, bus centred, sky sphere as full backdrop ───────
const BUS_ORBIT_RADIUS = 8.0; // Lower = closer zoom, higher = wider view
const BUS_ORBIT_Y      = 3.0; // Camera height
const BUS_LOOK_Y       = 2.5; // What vertical point the camera stares at
const BUS_ANGLE_START  =  Math.PI * 0.65;
const BUS_ANGLE_END    = -Math.PI * 0.35;
const BUS_FOV          = 62;  // Lower = telephoto/zoomed-in, higher = wide-angle

// ── Phase 2 — Race Track: 120° sweeping orbit, closer + more elevated ─────────────
const DRG_ORBIT_RADIUS = 20;    // Lower = closer zoom, higher = wider view
const DRG_ORBIT_Y_START = 10.0;   // starts high, swoops down
const DRG_ORBIT_Y_END   = 3.5;
const DRG_LOOK_Y        = 2.0;
const DRG_ANGLE_START   =  Math.PI * 0.55;  // right side
const DRG_ANGLE_END     = -Math.PI * 0.10;  // slight left of front
const DRG_FOV           = 58;

// ── Phase 3 —   Bedroom : camera orbits inside the sphere at modest radius ─────
// Camera at radius 8 so it's a sizable distance from center — sphere interior visible.
const SKY_ORBIT_RADIUS = 2.0;
const SKY_ORBIT_Y      = 2.0;
const SKY_LOOK_Y       = 0.5;
const SKY_ANGLE_START  =  Math.PI * 2;
const SKY_ANGLE_END    = -Math.PI * 0.60;
const SKY_FOV          = 72;

// ── Phase 4 — Above Clouds: camera orbits inside sphere, wider radius ─────────
const CLOUD_ORBIT_RADIUS = 35.0;
const CLOUD_ORBIT_Y      = 1.5;
const CLOUD_LOOK_Y       = 0.0;
const CLOUD_ANGLE_START  =  Math.PI * 0.30;
const CLOUD_ANGLE_END    = -Math.PI * 0.80;
const CLOUD_FOV          = 76;

// ── Phase 5 — Enchanted Forest: camera orbits inside sphere, looking toward center
const FOREST_ORBIT_RADIUS = 35.0;
const FOREST_ORBIT_Y      = 1.5;
const FOREST_LOOK_Y       = 0.5;
const FOREST_ANGLE_START  =  Math.PI * 0.40;
const FOREST_ANGLE_END    = -Math.PI * 0.70;
const FOREST_FOV          = 70;

// ── Phase 6 — Star Destroyer Hangar: slower, wider 360 orbit ─────────────────
const HANGAR_ORBIT_RADIUS = 6.0;
const HANGAR_ORBIT_Y      = 4.0;
const HANGAR_LOOK_Y       = 3.1;
const HANGAR_ANGLE_START  = Math.PI * 0.85;
const HANGAR_ANGLE_END    = HANGAR_ANGLE_START - Math.PI * 1.05;
const HANGAR_FOV          = 64;

const _pos       = new THREE.Vector3();
const _look      = new THREE.Vector3();
const _SPHERE_POS = new THREE.Vector3(0, 0.5, 0); // inside hollow sphere, slight eye-height offset

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
    const gp  = scrollStore.globalProgress;
    const fog = fogRef.current;

    // ── Phase 0: Manhattan dive ───────────────────────────────────────────────
    if (gp <= PHASES[0].end + 0.01) {
      const t     = phaseProgress(0, gp);
      const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

      _pos.lerpVectors(MAN_START, MAN_END, eased);
      camera.position.lerp(_pos, 9 * delta);
      camera.lookAt(-2, 4, 0);
      setFov(camera, 68, delta);
      setFogDensity(fog, 0.018, 8 * delta);
      return;
    }

    // ── Phase 1: Bus — orbital sweep ─────────────────────────────────────────
    if (gp < PHASES[2].start) {
      const pp    = phaseProgress(1, gp);
      setOrbitCamera(camera, pp, BUS_ORBIT_RADIUS, BUS_ORBIT_Y, BUS_LOOK_Y, BUS_ANGLE_START, BUS_ANGLE_END, BUS_FOV, delta, 3.5);
      setFogDensity(fog, 0.002, 6 * delta);
      return;
    }

    // ── Phase 2: Dragon — sweeping orbit, camera descends ────────────────────
    if (gp < PHASES[3].start) {
      const pp    = phaseProgress(2, gp);
      // ease-in-out for a smooth arc feel
      const eased = pp < 0.5 ? 2 * pp * pp : 1 - Math.pow(-2 * pp + 2, 2) / 2;

      const angle = THREE.MathUtils.lerp(DRG_ANGLE_START, DRG_ANGLE_END, eased);
      const y     = THREE.MathUtils.lerp(DRG_ORBIT_Y_START, DRG_ORBIT_Y_END, eased);
      _pos.set(
        Math.sin(angle) * DRG_ORBIT_RADIUS,
        y,
        Math.cos(angle) * DRG_ORBIT_RADIUS,
      );
      camera.position.lerp(_pos, 3.0 * delta);
      camera.lookAt(0, DRG_LOOK_Y, 0);
      setFov(camera, DRG_FOV, delta);
      setFogDensity(fog, 0.001, 8 * delta);
      return;
    }

    // ── Phase 3: Anime Sky — orbit inside sphere at sizable radius ───────────
    if (gp < PHASES[4].start) {
      const pp = phaseProgress(3, gp);
      setOrbitCamera(camera, pp, SKY_ORBIT_RADIUS, SKY_ORBIT_Y, SKY_LOOK_Y, SKY_ANGLE_START, SKY_ANGLE_END, SKY_FOV, delta, 2.0);
      setFogDensity(fog, 0.0002, 10 * delta);
      return;
    }

    // ── Phase 4: Above Clouds — photo sphere, mouse-look ────────────────────
    if (gp < PHASES[5].start) {
      camera.position.lerp(_SPHERE_POS, 8 * delta);
      const az4 = photoSphereStore.azimuth;
      const el4 = photoSphereStore.elevation;
      _look.set(
        Math.sin(az4) * Math.cos(el4),
        Math.sin(el4),
        Math.cos(az4) * Math.cos(el4),
      ).multiplyScalar(10).add(_SPHERE_POS);
      camera.lookAt(_look);
      setFov(camera, CLOUD_FOV, delta);
      setFogDensity(fog, 0.00015, 10 * delta);
      return;
    }

    // ── Phase 5: Enchanted Forest — photo sphere, mouse-look ─────────────────
    if (gp < PHASES[6].start) {
      camera.position.lerp(_SPHERE_POS, 8 * delta);
      const az5 = photoSphereStore.azimuth;
      const el5 = photoSphereStore.elevation;
      _look.set(
        Math.sin(az5) * Math.cos(el5),
        Math.sin(el5),
        Math.cos(az5) * Math.cos(el5),
      ).multiplyScalar(10).add(_SPHERE_POS);
      camera.lookAt(_look);
      setFov(camera, FOREST_FOV, delta);
      setFogDensity(fog, 0.00035, 10 * delta);
      return;
    }

    // ── Phase 6: Star Destroyer Hangar — wide 360 orbit ──────────────────────
    const pp = phaseProgress(6, gp);
    setOrbitCamera(camera, pp, HANGAR_ORBIT_RADIUS, HANGAR_ORBIT_Y, HANGAR_LOOK_Y, HANGAR_ANGLE_START, HANGAR_ANGLE_END, HANGAR_FOV, delta, 2.4);
    setFogDensity(fog, 0.0002, 10 * delta);
  });

  return null;
}
