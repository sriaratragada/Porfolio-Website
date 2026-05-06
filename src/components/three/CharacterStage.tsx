'use client';

// ── Character Stage ───────────────────────────────────────────────────────────
// Environment GLBs and character models, one per phase:
//   Phase 0 — Spider-Man symbiote  (foreground character, Manhattan)
//   Phase 1 — Battle Bus           (hover bob, orbit cam)
//   Phase 2 — Race Track           (sweeping orbit)
//   Phase 3 — Modern Bedroom       (interior orbit)
//   Phase 4 — Above-Clouds skybox  (360°, photo sphere)
//   Phase 5 — Enchanted Forest     (360°, photo sphere)
//   Phase 6 — Star Destroyer Hangar (360° orbit)
//
// Performance fixes:
//   • Materials are cached at load time — useFrame never traverses scene graph.
//   • depthWrite only disabled for back-face skyboxes; opaque models keep it on.
//   • visibility controlled via group.visible; opacity only blended during fades.
// ─────────────────────────────────────────────────────────────────────────────

import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { scrollStore, phaseOpacity, phaseProgress } from '@/lib/scrollStore';

interface ModelConfig {
  nickname:        string;
  path:            string;
  phaseIndex:      number;
  draco:           boolean;
  isEnv:           boolean;
  centerAtOrigin:  boolean;
  backSide:        boolean;
  spinMult:        number;
  hover:           boolean;
  targetHeight:    number;
  positionOffset?: [number, number, number]; // world-space offset (non-env models)
  tint:            { emissive: string; emissiveIntensity: number };
}

const MODELS: ModelConfig[] = [
  // ── Phase 0: Spider-Man (foreground character in Manhattan) ──────────────
  {
    nickname:       'SpiderMan',
    path:           '/models/spider-man_symbiote.glb',
    phaseIndex:     0,
    draco:          false,
    isEnv:          false,
    centerAtOrigin: false,
    backSide:       false,
    spinMult:       0.25,       // gentle slow spin to show off the model
    hover:          false,
    targetHeight:   1.9,        // ~human height
    positionOffset: [-1, 0, 0], // centre-left, camera dives toward this
    tint: { emissive: '#200010', emissiveIntensity: 0.15 },
  },
  // ── Phase 1: Battle Bus ──────────────────────────────────────────────────
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
  // ── Phase 2: Drift Race Track ────────────────────────────────────────────
  {
    nickname:       'Track',
    path:           '/models/drift_race_track_free.glb',
    phaseIndex:     2,
    draco:          false,
    isEnv:          true,
    centerAtOrigin: false,
    backSide:       false,
    spinMult:       0,
    hover:          false,
    targetHeight:   12,
    tint: { emissive: '#0a0500', emissiveIntensity: 0.06 },
  },
  // ── Phase 3: Jungle 360° photo sphere ──────────────────────────────────────────
  {
    nickname:       'Jungle',
    path:           '/models/jungle_02.glb',
    phaseIndex:     3,
    draco:          false,
    isEnv:          true,
    centerAtOrigin: true,
    backSide:       true,
    spinMult:       0,
    hover:          false,
    targetHeight:   64,
    tint: { emissive: '#061a08', emissiveIntensity: 0.06 },
  },
  // ── Phase 4: Above-Clouds skybox (photo sphere) ──────────────────────────
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
  // ── Phase 5: Enchanted Forest (photo sphere) ─────────────────────────────
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
  // ── Phase 6: Star Destroyer Hangar ──────────────────────────────────────
  {
    nickname:       'Hangar',
    path:           '/models/star-destroyer-hangar.glb',
    phaseIndex:     6,
    draco:          true,
    isEnv:          true,
    centerAtOrigin: true,
    backSide:       false,
    spinMult:       0,
    hover:          false,
    targetHeight:   22,
    tint: { emissive: '#080d14', emissiveIntensity: 0.08 },
  },
];

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function EnvironmentModel({ config }: { config: ModelConfig }) {
  const { scene }   = useGLTF(config.path, config.draco);
  const groupRef    = useRef<THREE.Group>(null);
  const spinY       = useRef(0);
  const hoverOffset = useRef(config.nickname.length * 0.731);
  const lastOpacity = useRef(-1);
  const dropTimer   = useRef(0);
  const wasVisible  = useRef(false);

  // ── Flat cached material list — populated ONCE at load, never traversed in useFrame ──
  // Holds THREE.Material (base class) so we can store both MeshBasicMaterial
  // (skybox photo spheres) and MeshStandardMaterial (everything else).
  const cachedMats = useRef<THREE.Material[]>([]);

  useEffect(() => {
    // Scale + position the scene
    const box    = new THREE.Box3().setFromObject(scene);
    const size   = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const scale  = config.targetHeight / size.y;

    scene.scale.setScalar(scale);
    const originY = config.centerAtOrigin ? -center.y * scale : -box.min.y * scale;
    scene.position.set(-center.x * scale, originY, -center.z * scale);

    // Apply materials + collect into flat cache
    const emissiveColor = new THREE.Color(config.tint.emissive);
    const mats: THREE.Material[] = [];

    scene.traverse((child) => {
      if (!(child as THREE.Mesh).isMesh) return;
      const mesh = child as THREE.Mesh;
      const ms   = Array.isArray(mesh.material) ? mesh.material : [mesh.material];

      if (config.backSide) {
        // ── Photo sphere: camera is INSIDE, so we need back-faces + no lighting.
        // Replace each material with MeshBasicMaterial (map-only, no lighting).
        // This is the Three.js-idiomatic way to render Google Street View-style
        // panoramas — MeshStandardMaterial emissive hacks fail when the source
        // material is already a MeshBasicMaterial (no emissive property).
        const newMats: THREE.MeshBasicMaterial[] = [];
        for (const m of ms) {
          const anyMat = m as any;
          // Hunt for the panorama texture across all common slots.
          // KHR_materials_pbrSpecularGlossiness diffuseTexture → material.map
          // Standard emissive panoramas                         → material.emissiveMap
          const tex: THREE.Texture | null =
            anyMat.map ?? anyMat.emissiveMap ?? anyMat.lightMap ?? anyMat.aoMap ?? null;

          const basicMat = new THREE.MeshBasicMaterial({
            map:         tex,
            // DoubleSide instead of BackSide — bypasses face culling entirely.
            // This fixes GLBs with doubleSided:false (e.g. skybox-above-clouds)
            // where BackSide would cull the inner face visible to the camera.
            side:        THREE.DoubleSide,
            transparent: true,
            opacity:     1,
            depthWrite:  false,
          });

          newMats.push(basicMat);
          mats.push(basicMat);
        }
        // Swap material(s) on the mesh so Three.js renders with the new material
        mesh.material = newMats.length === 1 ? newMats[0] : newMats;

      } else {
        // ── Opaque / non-skybox: keep existing MeshStandardMaterial, just configure it
        for (const m of ms as THREE.MeshStandardMaterial[]) {
          m.transparent = true;
          m.depthWrite  = true; // restored to false during fade via useFrame
          if (m.emissive !== undefined) {
            m.emissive.copy(emissiveColor);
            m.emissiveIntensity = config.tint.emissiveIntensity;
          }
          m.needsUpdate = true;
          mats.push(m);
        }
      }
    });

    cachedMats.current  = mats;
    lastOpacity.current = -1; // force a write on first frame
  }, [scene, config]);

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    const gp      = scrollStore.globalProgress;
    const opacity = phaseOpacity(config.phaseIndex, gp, 0.06);
    const pp      = phaseProgress(config.phaseIndex, gp);

    // ── Opacity — O(n) write only when value changes meaningfully ────────────
    const nowVisible = opacity > 0.001;
    if (wasVisible.current !== nowVisible || (nowVisible && Math.abs(opacity - lastOpacity.current) > 0.002)) {
      lastOpacity.current   = opacity;
      wasVisible.current    = nowVisible;
      groupRef.current.visible = nowVisible;

      // Direct writes to cached flat array — no traversal
      for (const m of cachedMats.current) {
        (m as THREE.MeshBasicMaterial | THREE.MeshStandardMaterial).opacity = opacity;
        // Restore depthWrite for opaque non-skybox materials when fully visible
        if (!config.backSide) {
          m.depthWrite = opacity > 0.95;
        }
      }
    }

    if (!nowVisible) return;

    // Scale pulse (subtle; environments only nudge between 0.98–1.02)
    groupRef.current.scale.setScalar(THREE.MathUtils.lerp(0.98, 1.02, pp));

    // ── Hover (Bus only) — drop-in + sine bob ────────────────────────────────
    if (config.hover) {
      if (!wasVisible.current) dropTimer.current = 0;
      dropTimer.current = Math.min(dropTimer.current + delta, 1.4);

      const dropT = easeOutCubic(Math.min(1, dropTimer.current / 1.4));
      const dropY = THREE.MathUtils.lerp(20, 0, dropT);
      hoverOffset.current += delta * 0.8;
      groupRef.current.position.y = dropY + Math.sin(hoverOffset.current) * 0.35;
      groupRef.current.rotation.y = 0;
      return;
    }

    // ── Slow spin (Spider-Man + any model with spinMult > 0) ─────────────────
    if (config.spinMult > 0) {
      spinY.current += delta * config.spinMult;
      groupRef.current.rotation.y = spinY.current;
    }
  });

  const offset = config.positionOffset ?? [0, 0, 0];
  return (
    <group ref={groupRef} position={offset} visible={false}>
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

// Preload all models (race track excluded — at 33 MB it's loaded on-demand)
useGLTF.preload('/models/spider-man_symbiote.glb',        false);
useGLTF.preload('/models/battle-bus.glb',                 true);
useGLTF.preload('/models/jungle_02.glb',                  false);
useGLTF.preload('/models/skybox-above-clouds.glb',        true);
useGLTF.preload('/models/skybox-enchanted-forest.glb',    true);
useGLTF.preload('/models/star-destroyer-hangar.glb',      true);
// drift_race_track_free.glb intentionally NOT preloaded (33 MB) — loads on scroll
// modern_bedroom.glb removed (replaced by jungle_02)
