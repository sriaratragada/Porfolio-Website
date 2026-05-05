'use client';

// ── Manhattan Background ──────────────────────────────────────────────────────
// Visible only during Phase 0. Fades out as the transition to characters begins.
// Camera zooms into the city; this component just holds the geometry in place.
// ─────────────────────────────────────────────────────────────────────────────

import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { scrollStore, PHASES, phaseOpacity, phaseProgress } from '@/lib/scrollStore';

const MODEL_PATH = '/models/manhattan-opt.glb';

// Verified math: native Y -5.92→+6.0, scale=3.5, posY=1.86 → tops at +22.86
// Camera visible range [-8.9, +14.9] at y=3, FOV=70, dist=17 → city looms ✓
const BASE_SCALE = 3.5;
const BASE_Y     = 1.86;
const BASE_Z     = -10;

export default function ManhattanBackground() {
  const { scene } = useGLTF(MODEL_PATH, true); // true = draco
  const groupRef  = useRef<THREE.Group>(null);
  const lastOpacity = useRef(1);

  // Pre-mark materials as transparent for fade-out
  useEffect(() => {
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        for (const mat of mats as THREE.MeshStandardMaterial[]) {
          mat.transparent = true;
        }
      }
    });
  }, [scene]);

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    const gp = scrollStore.globalProgress;
    const p0 = PHASES[0];

    // Phase 0 only. Must be fully gone by PHASES[1].start (0.14) when Bus appears.
    let opacity: number;
    if (gp <= 0.08)       opacity = 1.0;
    else if (gp <= 0.14)  opacity = THREE.MathUtils.lerp(1.0, 0.0, (gp - 0.08) / 0.06);
    else                  opacity = 0.0;

    groupRef.current.visible = opacity > 0.01;

    if (Math.abs(opacity - lastOpacity.current) > 0.005) {
      lastOpacity.current = opacity;
      scene.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          for (const mat of mats as THREE.MeshStandardMaterial[]) {
            mat.opacity = opacity;
          }
        }
      });
    }

    // During phase 0: scale up as camera zooms in. After: lock in place as ghost.
    if (gp <= PHASES[0].end) {
      const t = phaseProgress(0, gp);
      const targetScale = THREE.MathUtils.lerp(BASE_SCALE, 4.2, Math.min(t * 1.3, 1));
      groupRef.current.scale.setScalar(
        THREE.MathUtils.damp(groupRef.current.scale.x, targetScale, 3, delta)
      );
      groupRef.current.position.y = THREE.MathUtils.damp(
        groupRef.current.position.y,
        THREE.MathUtils.lerp(BASE_Y, -0.5, Math.min(t * 1.3, 1)),
        3, delta
      );
    }
    // Ghost stays fixed — no more movement
  });

  return (
    <group ref={groupRef} position={[0, BASE_Y, BASE_Z]} scale={BASE_SCALE}>
      <primitive object={scene} />
    </group>
  );
}

useGLTF.preload(MODEL_PATH, true);
