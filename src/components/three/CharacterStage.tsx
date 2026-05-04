'use client';

// ── Character Stage ───────────────────────────────────────────────────────────
// Nicknames:
//   "Symbiote" = spider-man_symbiote.glb  (black suit, phase 1) — spins full speed
//   "Classic"  = spider-man-classic.glb   (MCU red/blue, phase 2) — slow turn
//   "Luke"     = luke-skywalker.glb       (Mandalorian, phase 3) — faces camera, sways
//
// Each model gets a distinct emissive tint applied to its materials:
//   Symbiote → cold blue-white edge (venom-esque)
//   Classic  → warm red-blue split
//   Luke     → warm amber
// ─────────────────────────────────────────────────────────────────────────────

import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { scrollStore, phaseOpacity, phaseProgress } from '@/lib/scrollStore';

const TARGET_HEIGHT = 7.5;
const SPIN_SPEED    = 0.28;

// Luke confirmed by user: 3π/2 faces toward camera
const LUKE_FACING_OFFSET = Math.PI * 1.5;

// Per-character visual identity
const CHAR_TINT: Record<number, { emissive: string; emissiveIntensity: number }> = {
  // Symbiote: cold steel-blue edge glow — symbiote energy
  1: { emissive: '#1a3a6e', emissiveIntensity: 0.18 },
  // Classic MCU: subtle warm red — signature Spidey red
  2: { emissive: '#6e1a1a', emissiveIntensity: 0.14 },
  // Luke: warm amber — Mandalorian/Jedi warmth
  3: { emissive: '#5a3a10', emissiveIntensity: 0.12 },
};

const MODELS = [
  { path: '/models/spider-man_symbiote.glb', phaseIndex: 1, draco: false, spinMult: 1.0  }, // Symbiote
  { path: '/models/spider-man-classic.glb',  phaseIndex: 2, draco: true,  spinMult: 0.35 }, // Classic
  { path: '/models/luke-skywalker.glb',      phaseIndex: 3, draco: true,  spinMult: 0.0  }, // Luke
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

  useEffect(() => {
    const box    = new THREE.Box3().setFromObject(scene);
    const size   = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const scale  = TARGET_HEIGHT / size.y;

    scene.scale.setScalar(scale);
    scene.position.set(-center.x * scale, -box.min.y * scale, -center.z * scale);

    const tint = CHAR_TINT[phaseIndex];
    const emissiveColor = new THREE.Color(tint.emissive);

    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        for (const mat of mats as THREE.MeshStandardMaterial[]) {
          mat.transparent = true;
          mat.depthWrite  = false;
          // Apply per-character identity tint
          if (mat.emissive !== undefined) {
            mat.emissive.copy(emissiveColor);
            mat.emissiveIntensity = tint.emissiveIntensity;
          }
        }
      }
    });
  }, [scene, phaseIndex]);

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

    // ── Scale: grows 0.9→1.25 as phase progresses ───────────────
    groupRef.current.scale.setScalar(THREE.MathUtils.lerp(0.9, 1.25, pp));

    // ── Rotation ─────────────────────────────────────────────────
    if (phaseIndex === 3) {
      // Luke: locked to camera with a subtle breathing sway (±12°)
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
