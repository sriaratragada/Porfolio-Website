'use client';

// ── Cinematic Camera Controller ───────────────────────────────────────────────
// Each phase has a distinct camera path so transitions feel like real cuts:
//
// Phase 0 — Manhattan: wide crane shot diving into the city
// Phase 1 — Bus: cinematic ~160° orbit around the bus (right-side → front)
// Phase 2 — Symbiote: close portrait, slow push-in
// Phase 3 — Gojo: off-axis approach swings to center
// ─────────────────────────────────────────────────────────────────────────────

import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { scrollStore, PHASES, phaseProgress } from '@/lib/scrollStore';

// ── Phase 0 — Manhattan crane dive ───────────────────────────────────────────
const MAN_START = new THREE.Vector3(-2,  8, 17);
const MAN_END   = new THREE.Vector3( 0,  3,  1);

// ── Phase 1 — Bus: 180° orbit with bus centred, sky sphere as backdrop ────────
// Radius 16 keeps camera well outside the bus mesh. The GLB sky sphere extends
// far beyond the orbit so it fills the entire background.
const BUS_ORBIT_RADIUS = 16;
const BUS_ORBIT_Y      = 3.0;   // mid-height of a 6-unit tall bus
const BUS_LOOK_Y       = 3.0;
const BUS_ANGLE_START  =  Math.PI * 0.65;  // right-back flank
const BUS_ANGLE_END    = -Math.PI * 0.35;  // left-back flank (180° arc through front)

// ── Phase 2 — Symbiote: clean portrait push-in ───────────────────────────────
const SYM_POS_START = new THREE.Vector3(0, 2.2, 8.5);
const SYM_POS_END   = new THREE.Vector3(0, 2.8, 6.0);
const SYM_LOOK      = new THREE.Vector3(0, 3.8, 0);

// ── Phase 3 — Gojo: off-axis swings to center — cinematic arc ────────────────
const GOJ_POS_START = new THREE.Vector3(-3.0, 3.2, 8.0);
const GOJ_POS_END   = new THREE.Vector3( 0.5, 2.8, 5.5);
const GOJ_LOOK      = new THREE.Vector3( 0,   4.0, 0);

const _pos  = new THREE.Vector3();

export default function CameraController() {
  const { camera, scene } = useThree();

  useFrame((_, delta) => {
    const gp  = scrollStore.globalProgress;
    const fog = scene.fog as THREE.FogExp2 | undefined;

    // ── Phase 0: Manhattan dive ───────────────────────────────────────────────
    if (gp <= PHASES[0].end + 0.01) {
      const t     = phaseProgress(0, gp);
      const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

      _pos.lerpVectors(MAN_START, MAN_END, eased);
      camera.position.lerp(_pos, 9 * delta);
      camera.lookAt(-2, 4, 0);
      if (fog) fog.density = THREE.MathUtils.lerp(fog.density, 0.018, 8 * delta);
      return;
    }

    // ── Phase 1: Bus — orbital sweep around the bus ───────────────────────────
    if (gp < PHASES[2].start) {
      const pp    = phaseProgress(1, gp);
      // Smooth ease-out so the arc decelerates as it reaches the front
      const eased = 1 - Math.pow(1 - pp, 2.5);

      const angle = THREE.MathUtils.lerp(BUS_ANGLE_START, BUS_ANGLE_END, eased);
      _pos.set(
        Math.sin(angle) * BUS_ORBIT_RADIUS,
        BUS_ORBIT_Y,
        Math.cos(angle) * BUS_ORBIT_RADIUS,
      );
      camera.position.lerp(_pos, 3.5 * delta);
      camera.lookAt(0, BUS_LOOK_Y, 0);
      if (fog) fog.density = THREE.MathUtils.lerp(fog.density, 0.002, 6 * delta);
      return;
    }

    // ── Phase 2: Symbiote — sharp portrait ────────────────────────────────────
    if (gp < PHASES[3].start) {
      const pp    = phaseProgress(2, gp);
      const eased = pp * pp;

      _pos.lerpVectors(SYM_POS_START, SYM_POS_END, eased);
      camera.position.lerp(_pos, 4 * delta);
      camera.lookAt(SYM_LOOK);
      if (fog) fog.density = THREE.MathUtils.lerp(fog.density, 0.0005, 10 * delta);
      return;
    }

    // ── Phase 3: Gojo — off-axis arc swings to center ─────────────────────────
    {
      const pp    = phaseProgress(3, gp);
      const eased = pp < 0.5 ? 2 * pp * pp : 1 - Math.pow(-2 * pp + 2, 2) / 2;

      _pos.lerpVectors(GOJ_POS_START, GOJ_POS_END, eased);
      camera.position.lerp(_pos, 3.5 * delta);
      camera.lookAt(GOJ_LOOK);
      if (fog) fog.density = THREE.MathUtils.lerp(fog.density, 0.0005, 10 * delta);
    }
  });

  return null;
}
