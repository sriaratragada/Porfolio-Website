'use client';

// ── Character Stage ───────────────────────────────────────────────────────────
// Three models: Symbiote Spidey → Classic MCU Spidey → Luke Skywalker.
// Symbiote spins fast. Classic spins slowly (centered turntable).
// Luke holds a fixed front-facing angle with a subtle sway.
// All models scale 0.85→1.2 as phaseProgress goes 0→1.
// ─────────────────────────────────────────────────────────────────────────────

import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { scrollStore, phaseOpacity, phaseProgress } from '@/lib/scrollStore';

const TARGET_HEIGHT = 7.5; // world units — large and heroic
const SPIN_SPEED    = 0.28; // base rad/s (symbiote)

// Luke's Y rotation: at π he faced +X (sideways); front vector = (-1,0,0) at rot=0
// To face +Z (camera): sin(r)=1 → r = π/2
const LUKE_FACING_OFFSET = Math.PI / 2;

const MODELS = [
  { path: '/models/spider-man_symbiote.glb', phaseIndex: 1, draco: false, spinMult: 1.0 },
  { path: '/models/spider-man-classic.glb',  phaseIndex: 2, draco: true,  spinMult: 0.35 }, // slow, centered
  { path: '/models/luke-skywalker.glb',      phaseIndex: 3, draco: true,  spinMult: 0.0  }, // no spin
] as const;

interface CharacterModelProps {
  path: string;
  phaseIndex: number;
  draco: boolean;
  spinMult: number;
}

function CharacterModel({ path, phaseIndex, draco, spinMult }: CharacterModelProps) {
  const { scene }   = useGLTF(path, draco);
  const groupRef    = useRef<THREE.Group>(null);
  const spinY       = useRef(phaseIndex === 3 ? LUKE_FACING_OFFSET : 0);
  const lastOpacity = useRef(-1);

  // Auto-scale & center from bounding box
  useEffect(() => {
    const box    = new THREE.Box3().setFromObject(scene);
    const size   = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const scale  = TARGET_HEIGHT / size.y;

    scene.scale.setScalar(scale);
    scene.position.set(
      -center.x * scale,  // center X on bounding box midpoint
      -box.min.y * scale, // feet at y=0
      -center.z * scale
    );

    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        for (const mat of mats as THREE.MeshStandardMaterial[]) {
          mat.transparent = true;
          mat.depthWrite  = false;
        }
      }
    });
  }, [scene]);

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    const gp      = scrollStore.globalProgress;
    const opacity = phaseOpacity(phaseIndex, gp, 0.05);
    const pp      = phaseProgress(phaseIndex, gp);

    // ── Opacity ──────────────────────────────────────────────────
    if (Math.abs(opacity - lastOpacity.current) > 0.003) {
      lastOpacity.current = opacity;
      groupRef.current.visible = opacity > 0.001;
      scene.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          for (const mat of mats as THREE.MeshStandardMaterial[]) {
            mat.opacity    = opacity;
            mat.depthWrite = opacity > 0.98;
          }
        }
      });
    }

    // ── Scale: grows 0.85→1.2 as phase progresses ───────────────
    groupRef.current.scale.setScalar(THREE.MathUtils.lerp(0.85, 1.2, pp));

    // ── Rotation ─────────────────────────────────────────────────
    if (phaseIndex === 3) {
      // Luke: face camera + very slow sway (±12°)
      const swayTarget = LUKE_FACING_OFFSET + Math.sin(Date.now() * 0.0004) * 0.21;
      spinY.current = THREE.MathUtils.lerp(spinY.current, swayTarget, delta * 2.5);
    } else if (spinMult > 0) {
      const nearTransition = [0.22, 0.47, 0.73].some(t => Math.abs(gp - t) < 0.03);
      spinY.current += delta * SPIN_SPEED * spinMult * (nearTransition ? 2.5 : 1.0);
    }
    groupRef.current.rotation.y = spinY.current;
  });

  return (
    <group ref={groupRef} position={[0, 0, 0]} visible={false}>
      <primitive object={scene} />
    </group>
  );
}

export default function CharacterStage() {
  return (
    <>
      {MODELS.map((m) => (
        <CharacterModel
          key={m.path}
          path={m.path}
          phaseIndex={m.phaseIndex}
          draco={m.draco}
          spinMult={m.spinMult}
        />
      ))}
    </>
  );
}

useGLTF.preload('/models/spider-man_symbiote.glb');
useGLTF.preload('/models/spider-man-classic.glb', true);
useGLTF.preload('/models/luke-skywalker.glb',     true);
