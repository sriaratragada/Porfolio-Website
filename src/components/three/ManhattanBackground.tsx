'use client';

// ── Manhattan Background ──────────────────────────────────────────────────────
// Visible only during Phase 0. Fades out as the transition to characters begins.
// Camera zooms into the city; this component holds the geometry in place.
//
// Materials are cached at load time — useFrame never traverses the scene graph.
// ─────────────────────────────────────────────────────────────────────────────

import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { scrollStore, PHASES, phaseProgress } from '@/lib/scrollStore';

const MODEL_PATH = '/models/manhattan-opt.glb';

const BASE_SCALE = 3.5;
const BASE_Y     = 1.86;
const BASE_Z     = -10;

export default function ManhattanBackground() {
  const { scene } = useGLTF(MODEL_PATH, true); // Draco compressed
  const groupRef  = useRef<THREE.Group>(null);
  const lastOpacity  = useRef(1);
  const cachedMats   = useRef<THREE.MeshStandardMaterial[]>([]);

  // Cache all materials once at load — no traversal in useFrame
  useEffect(() => {
    const mats: THREE.MeshStandardMaterial[] = [];
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        const ms   = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        for (const m of ms as THREE.MeshStandardMaterial[]) {
          m.transparent = true;
          mats.push(m);
        }
      }
    });
    cachedMats.current = mats;
    lastOpacity.current = -1; // force first-frame write
  }, [scene]);

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    const gp = scrollStore.globalProgress;

    // Phase 0 only. Fully visible until 8%, then fades to 0 by 14%.
    let opacity: number;
    if      (gp <= 0.08) opacity = 1.0;
    else if (gp <= 0.14) opacity = THREE.MathUtils.lerp(1.0, 0.0, (gp - 0.08) / 0.06);
    else                 opacity = 0.0;

    groupRef.current.visible = opacity > 0.01;

    // Only write to GPU materials when the value actually changes
    if (Math.abs(opacity - lastOpacity.current) > 0.005) {
      lastOpacity.current = opacity;
      for (const m of cachedMats.current) {
        m.opacity    = opacity;
        m.depthWrite = opacity > 0.95;
      }
    }

    // During phase 0: scale up as camera zooms in; lock afterwards
    if (gp <= PHASES[0].end) {
      const t           = phaseProgress(0, gp);
      const targetScale = THREE.MathUtils.lerp(BASE_SCALE, 4.2, Math.min(t * 1.3, 1));
      groupRef.current.scale.setScalar(
        THREE.MathUtils.damp(groupRef.current.scale.x, targetScale, 3, delta),
      );
      groupRef.current.position.y = THREE.MathUtils.damp(
        groupRef.current.position.y,
        THREE.MathUtils.lerp(BASE_Y, -0.5, Math.min(t * 1.3, 1)),
        3, delta,
      );
    }
  });

  return (
    <group ref={groupRef} position={[0, BASE_Y, BASE_Z]} scale={BASE_SCALE}>
      <primitive object={scene} />
    </group>
  );
}

useGLTF.preload(MODEL_PATH, true);
