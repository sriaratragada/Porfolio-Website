'use client';

// ── Character Stage ───────────────────────────────────────────────────────────
// Nicknames & phase order:
//   "Bus"     = battle-bus.glb            (phase 1) — drop-in, hover, no spin
//   "Symbiote"= spider-man_symbiote.glb   (phase 2) — full turntable spin
//   "Gojo"    = gojo.glb                  (phase 3) — slow spin, faces front
//
// Each model auto-scales to its targetHeight and centers on its bounding box.
// Bus gets a dramatic drop-in entrance then gentle hover bob.
// ─────────────────────────────────────────────────────────────────────────────

import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { scrollStore, phaseOpacity, phaseProgress } from '@/lib/scrollStore';

const SPIN_SPEED = 0.22; // rad/s for Symbiote and Gojo

// Per-character config
const MODELS = [
  {
    nickname:    'Bus',
    path:        '/models/battle-bus.glb',
    phaseIndex:  1,
    draco:       true,
    spinMult:    0.0,
    hover:       true,
    targetHeight: 6,    // bus body as focal point; sky sphere extends well beyond orbit
    tint: { emissive: '#2a1a00', emissiveIntensity: 0.10 },
  },
  {
    nickname:    'Symbiote',
    path:        '/models/spider-man_symbiote.glb',
    phaseIndex:  2,
    draco:       false,
    spinMult:    1.0,
    hover:       false,
    targetHeight: 7.5,
    tint: { emissive: '#1a3a6e', emissiveIntensity: 0.18 },
  },
  {
    nickname:    'Gojo',
    path:        '/models/gojo.glb',
    phaseIndex:  3,
    draco:       true,
    spinMult:    0.28,
    hover:       false,
    targetHeight: 7.5,
    tint: { emissive: '#0a0a50', emissiveIntensity: 0.20 },
  },
] as const;

type ModelConfig = typeof MODELS[number];

// Easing: cubic out — fast start, smooth landing
function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function CharacterModel({ config }: { config: ModelConfig }) {
  const { scene }      = useGLTF(config.path, config.draco);
  const groupRef       = useRef<THREE.Group>(null);
  const spinY          = useRef(0);
  const hoverOffset    = useRef(Math.random() * Math.PI * 2);
  const lastOpacity    = useRef(-1);
  // Drop-in state for the Bus
  const dropTimer      = useRef(0);
  const wasVisible     = useRef(false);

  useEffect(() => {
    const box    = new THREE.Box3().setFromObject(scene);
    const size   = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const scale  = config.targetHeight / size.y;

    scene.scale.setScalar(scale);
    scene.position.set(
      -center.x * scale,
      -box.min.y * scale,
      -center.z * scale,
    );

    const emissiveColor = new THREE.Color(config.tint.emissive);

    scene.traverse((child) => {
      if (!(child as THREE.Mesh).isMesh) return;
      const mesh = child as THREE.Mesh;
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      for (const m of mats as THREE.MeshStandardMaterial[]) {
        m.transparent = true;
        m.depthWrite  = false;
        if (m.emissive !== undefined) {
          m.emissive.copy(emissiveColor);
          m.emissiveIntensity = config.tint.emissiveIntensity;
        }
      }
    });
  }, [scene, config]);

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    const gp      = scrollStore.globalProgress;
    const opacity = phaseOpacity(config.phaseIndex, gp, 0.06);
    const pp      = phaseProgress(config.phaseIndex, gp);

    // ── Opacity ──────────────────────────────────────────────────
    if (Math.abs(opacity - lastOpacity.current) > 0.002) {
      lastOpacity.current = opacity;
      groupRef.current.visible = opacity > 0.001;
      scene.traverse((child) => {
        if (!(child as THREE.Mesh).isMesh) return;
        const mesh = child as THREE.Mesh;
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        for (const m of mats as THREE.MeshStandardMaterial[]) {
          m.opacity    = opacity;
          m.depthWrite = opacity > 0.95;
        }
      });
    }

    // ── Scale ────────────────────────────────────────────────────
    groupRef.current.scale.setScalar(THREE.MathUtils.lerp(0.88, 1.22, pp));

    // ── Rotation / hover ─────────────────────────────────────────
    if (config.hover) {
      const isVisible = opacity > 0.001;

      // Reset drop timer when phase becomes active again from scratch
      if (isVisible && !wasVisible.current) {
        dropTimer.current = 0;
      }
      wasVisible.current = isVisible;

      if (isVisible) {
        dropTimer.current = Math.min(dropTimer.current + delta, 1.4);
      }

      // Drop from y=28 → 0 over 1.4 seconds, then hover bob on top
      const DROP_HEIGHT = 20;
      const DROP_DURATION = 1.4;
      const dropT   = easeOutCubic(Math.min(1, dropTimer.current / DROP_DURATION));
      const dropY   = THREE.MathUtils.lerp(DROP_HEIGHT, 0, dropT);

      hoverOffset.current += delta * 0.8;
      const hoverY = Math.sin(hoverOffset.current) * 0.35;

      groupRef.current.position.y = dropY + hoverY;
      groupRef.current.rotation.y = 0;
    } else if (config.spinMult > 0) {
      const nearTransition = [0.22, 0.47, 0.73].some(t => Math.abs(gp - t) < 0.03);
      spinY.current += delta * SPIN_SPEED * config.spinMult * (nearTransition ? 2.2 : 1.0);
      groupRef.current.rotation.y = spinY.current;
    }
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
        <CharacterModel key={m.path} config={m} />
      ))}
    </>
  );
}

useGLTF.preload('/models/battle-bus.glb',          true);
useGLTF.preload('/models/spider-man_symbiote.glb');
useGLTF.preload('/models/gojo.glb',                true);
