'use client';

// ── Character Stage ───────────────────────────────────────────────────────────
// Environment GLBs:
//   "Bus"    = battle-bus.glb         (phase 1) — drop-in, hover bob, orbit cam
//   "Dragon" = wrath_of_the_dragon    (phase 2) — slow self-rotation, orbit cam
//   "Sky"    = anime_sky.glb          (phase 3) — large skybox, cam drifts inside
//   Later 360 GLBs mirror the Battle Bus fade/scale pattern farther down-page.
//
// Environments skip the scale-pulse used for character models (isEnv: true).
// ─────────────────────────────────────────────────────────────────────────────

import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { scrollStore, phaseOpacity, phaseProgress } from '@/lib/scrollStore';

const MODELS = [
  {
    nickname:       'Bus',
    path:           '/models/battle-bus.glb',
    phaseIndex:     1,
    draco:          true,
    isEnv:          true,
    centerAtOrigin: false,
    backSide:       false,
    spinMult:       0,
    hover:          true,
    targetHeight:   6,
    tint: { emissive: '#1a1000', emissiveIntensity: 0.08 },
  },
  {
    nickname:       'Track',
    path:           '/models/drift_race_track_free.glb',
    phaseIndex:     2,
    draco:          false,  // not Draco-compressed
    isEnv:          true,
    centerAtOrigin: false,
    backSide:       false,
    spinMult:       0,
    hover:          false,
    targetHeight:   12,
    tint: { emissive: '#0a0500', emissiveIntensity: 0.06 },
  },
  {
    nickname:       'Bedroom',
    path:           '/models/modern_bedroom.glb',
    phaseIndex:     3,
    draco:          false,  // not Draco-compressed — decoder was corrupting geometry
    isEnv:          true,
    centerAtOrigin: false,  // floor at y=0, camera orbits inside at eye height
    backSide:       false,
    spinMult:       0,
    hover:          false,
    targetHeight:   7,      // scale so depth (~77 units) contains orbit radius 35
    tint: { emissive: '#050d1a', emissiveIntensity: 0.04 },
  },
  {
    nickname:       'Clouds',
    path:           '/models/skybox-above-clouds.glb',
    phaseIndex:     4,
    draco:          true,
    isEnv:          true,
    centerAtOrigin: true,
    backSide:       true,
    spinMult:       0,
    hover:          false,
    targetHeight:   70,
    tint: { emissive: '#101822', emissiveIntensity: 0.05 },
  },
  {
    nickname:       'Forest',
    path:           '/models/skybox-enchanted-forest.glb',
    phaseIndex:     5,
    draco:          true,
    isEnv:          true,
    centerAtOrigin: true,
    backSide:       true,
    spinMult:       0,
    hover:          false,
    targetHeight:   64,
    tint: { emissive: '#06170c', emissiveIntensity: 0.07 },
  },
  {
    nickname:       'Hangar',
    path:           '/models/star-destroyer-hangar.glb',
    phaseIndex:     6,
    draco:          true,
    isEnv:          true,
    centerAtOrigin: true,   // cube env — camera at geometric center avoids corner warp
    backSide:       false,  // hangar normals already face inward — no flip needed
    spinMult:       0,
    hover:          false,
    targetHeight:   22,
    tint: { emissive: '#080d14', emissiveIntensity: 0.08 },
  },
] as const;

type ModelConfig = typeof MODELS[number];

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function EnvironmentModel({ config }: { config: ModelConfig }) {
  const { scene }    = useGLTF(config.path, config.draco);
  const groupRef     = useRef<THREE.Group>(null);
  const spinY        = useRef(0);
  const hoverOffset  = useRef(config.nickname.length * 0.731);
  const lastOpacity   = useRef(-1);
  const dropTimer     = useRef(0);
  const wasVisibleRef = useRef(false);

  useEffect(() => {
    const box    = new THREE.Box3().setFromObject(scene);
    const size   = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const scale  = config.targetHeight / size.y;

    scene.scale.setScalar(scale);
    // Skyboxes: center the sphere/cube at world origin so camera inside sits at (0,0,0).
    // Other models: base sits at y=0 so characters stand on the floor.
    const originY = config.centerAtOrigin ? -center.y * scale : -box.min.y * scale;
    scene.position.set(-center.x * scale, originY, -center.z * scale);

    const emissiveColor = new THREE.Color(config.tint.emissive);
    scene.traverse((child) => {
      if (!(child as THREE.Mesh).isMesh) return;
      const mesh = child as THREE.Mesh;
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];

      for (const m of mats as THREE.MeshStandardMaterial[]) {
        m.transparent = true;
        m.depthWrite  = false;

        if (config.backSide) {
          // Photo sphere: render back faces so camera inside sees the panorama.
          // Self-illuminate via emissiveMap so lighting direction doesn't matter.
          m.side = THREE.BackSide;
          const anyMat = m as any;
          // Widen texture search — panorama may be in map, emissiveMap, or lightMap
          const tex: THREE.Texture | null =
            anyMat.map ?? anyMat.emissiveMap ?? anyMat.lightMap ?? null;
          if (anyMat.emissive !== undefined) {
            anyMat.emissiveMap       = tex;
            anyMat.emissive          = new THREE.Color(1, 1, 1);
            anyMat.emissiveIntensity = 1.0;
            anyMat.roughness         = 1;
            anyMat.metalness         = 0;
          } else if (tex && anyMat.map == null) {
            // MeshBasicMaterial: ensure the found texture is in map slot
            anyMat.map = tex;
          }
        } else if (m.emissive !== undefined) {
          m.emissive.copy(emissiveColor);
          m.emissiveIntensity = config.tint.emissiveIntensity;
        }

        m.needsUpdate = true;
      }
    });
    // Always force a fresh opacity pass after material setup —
    // stale lastOpacity would suppress the update on new materials.
    lastOpacity.current = -1;
  }, [scene, config]);

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    const gp      = scrollStore.globalProgress;
    const opacity = phaseOpacity(config.phaseIndex, gp, 0.06);
    const pp      = phaseProgress(config.phaseIndex, gp);

    // ── Opacity ──────────────────────────────────────────────────
    const wasVisible = lastOpacity.current > 0.001;
    const isVisible  = opacity > 0.001;
    if (wasVisible !== isVisible || (isVisible && Math.abs(opacity - lastOpacity.current) > 0.002)) {
      lastOpacity.current = opacity;
      groupRef.current.visible = isVisible;
      scene.traverse((child) => {
        if (!(child as THREE.Mesh).isMesh) return;
        const mesh = child as THREE.Mesh;
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        for (const m of mats as THREE.MeshStandardMaterial[]) {
          m.opacity    = opacity;
          m.depthWrite = opacity > 0.95 && !config.backSide;
        }
      });
    }

    // Environments stay at scale 1 — no dramatic scale pulse
    groupRef.current.scale.setScalar(THREE.MathUtils.lerp(0.98, 1.02, pp));

    // ── Hover (Bus only) ─────────────────────────────────────────
    if (config.hover) {
      const isVisible = opacity > 0.001;
      if (isVisible && !wasVisibleRef.current) dropTimer.current = 0;
      wasVisibleRef.current = isVisible;
      if (isVisible) dropTimer.current = Math.min(dropTimer.current + delta, 1.4);

      const dropT = easeOutCubic(Math.min(1, dropTimer.current / 1.4));
      const dropY = THREE.MathUtils.lerp(20, 0, dropT);
      hoverOffset.current += delta * 0.8;
      groupRef.current.position.y = dropY + Math.sin(hoverOffset.current) * 0.35;
      groupRef.current.rotation.y = 0;
      return;
    }

    // ── Slow environment spin (Dragon) ───────────────────────────
    if (config.spinMult > 0) {
      spinY.current += delta * config.spinMult;
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
        <EnvironmentModel key={m.path} config={m} />
      ))}
    </>
  );
}

useGLTF.preload('/models/battle-bus.glb',              true);
useGLTF.preload('/models/drift_race_track_free.glb',   false);
useGLTF.preload('/models/modern_bedroom.glb',          false);
useGLTF.preload('/models/skybox-above-clouds.glb',     true);
useGLTF.preload('/models/skybox-enchanted-forest.glb', true);
useGLTF.preload('/models/star-destroyer-hangar.glb',   true);
