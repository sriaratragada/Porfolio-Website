'use client';

// ── Multi-phase Camera Controller ─────────────────────────────────────────────
// Phase 0  — Manhattan flythrough: z=17 → z=1 with ease-in-out.
// Phase 1-3 — Each character phase: z=6.2 → z=4.2 (comfortable portrait zoom).
//             At each transition the camera snaps back to z=6.2 — hidden by flash.
// ─────────────────────────────────────────────────────────────────────────────

import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { scrollStore, PHASES, phaseProgress } from '@/lib/scrollStore';

// Phase 0 — Manhattan
const MAN_START = new THREE.Vector3(-2, 8, 17);
const MAN_END   = new THREE.Vector3( 0, 3,  1);

// Phase 1-3 — Character portrait
// z=6.2 at phase start → z=4.2 at phase end
// At z=6.2, FOV=68°: model (4.8 units tall) fills ~55% of frame height
// At z=4.2, FOV=68°: model (4.8 * 1.15) fills ~95% → strong zoom feel
const CHAR_Z_FAR  = 6.2;
const CHAR_Z_NEAR = 4.2;
const CHAR_Y      = 1.8;  // camera height — just below model center for heroic angle
const CHAR_LOOK   = new THREE.Vector3(0, 2.8, 0); // aim at chest/face

const _target = new THREE.Vector3();

export default function CameraController() {
  const { camera, scene } = useThree();

  useFrame((_, delta) => {
    const gp = scrollStore.globalProgress;
    const p0 = PHASES[0];

    if (gp <= p0.end + 0.01) {
      // ── Phase 0: fly into Manhattan ────────────────────────────────
      const t = phaseProgress(0, gp);
      const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

      _target.lerpVectors(MAN_START, MAN_END, eased);
      camera.position.lerp(_target, 9 * delta);
      camera.lookAt(-2, 4, 0);

      if (scene.fog) (scene.fog as THREE.FogExp2).density = 0.018;

    } else {
      // ── Phase 1-3: per-phase push-in ───────────────────────────────
      let currentPhaseIdx = 1;
      if      (gp >= PHASES[3].start) currentPhaseIdx = 3;
      else if (gp >= PHASES[2].start) currentPhaseIdx = 2;

      const pp = phaseProgress(currentPhaseIdx, gp); // 0→1 within current phase
      // Ease-in: zoom accelerates in the second half
      const easedPP = pp * pp;
      const targetZ = THREE.MathUtils.lerp(CHAR_Z_FAR, CHAR_Z_NEAR, easedPP);

      _target.set(0, CHAR_Y, targetZ);
      camera.position.lerp(_target, 5 * delta);
      camera.lookAt(CHAR_LOOK);

      // Clear fog so characters render crisp
      if (scene.fog) {
        const fog = scene.fog as THREE.FogExp2;
        fog.density = THREE.MathUtils.lerp(fog.density, 0.0005, 10 * delta);
      }
    }
  });

  return null;
}
