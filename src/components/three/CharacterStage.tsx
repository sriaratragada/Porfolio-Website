'use client';

// ── Character Stage (v2) ──────────────────────────────────────────────────────
// Clean separation:
//   • GLTFModel — phases 0 (Spider-Man), 1 (Bus), 2 (Track), 6 (Hangar)
//   • SkyboxSphere — phases 3 (Jungle), 4 (Clouds), 5 (Forest)
//       Uses equirectangular JPEG textures on a simple sphere.
//       No GLB material guesswork — eliminates the KHR_pbrSpecularGlossiness war.
//
// Every component uses the ref-based useFade pattern (matsRef, not mats value)
// to avoid the stale-array race condition.
// ─────────────────────────────────────────────────────────────────────────────

import { useRef, useEffect, useMemo } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { scrollStore, phaseOpacity, phaseProgress } from '@/lib/scrollStore';

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

// ── useFade — ref-based material fade ────────────────────────────────────────
// Accepts a ref to the mats array, NOT the array value.
// The useEffect that populates cachedMats.current runs after render;
// reading .current per-frame ensures we always see the populated list.

function useFade(
  groupRef: React.RefObject<THREE.Group | null>,
  phaseIndex: number,
  matsRef: React.RefObject<THREE.Material[]>,
  restoreDepthWrite: boolean,
) {
  const lastOpacity = useRef(-1);
  const wasVisible  = useRef(false);

  useFrame(() => {
    if (!groupRef.current) return;
    const gp      = scrollStore.globalProgress;
    const opacity = phaseOpacity(phaseIndex, gp, 0.06);

    const nowVisible = opacity > 0.001;
    if (
      wasVisible.current !== nowVisible ||
      (nowVisible && Math.abs(opacity - lastOpacity.current) > 0.002)
    ) {
      lastOpacity.current  = opacity;
      wasVisible.current   = nowVisible;
      groupRef.current.visible = nowVisible;

      for (const m of matsRef.current) {
        m.opacity = opacity;
        if (restoreDepthWrite) {
          m.depthWrite = opacity > 0.95;
        }
      }
    }
  });
}

// ═════════════════════════════════════════════════════════════════════════════
//  GLTF MODELS — phases 0, 1, 2, 6
// ═════════════════════════════════════════════════════════════════════════════

// ── Phase 0: Spider-Man ──────────────────────────────────────────────────────
function SpiderManModel() {
  const { scene } = useGLTF('/models/spider-man_symbiote.glb', false);
  const groupRef   = useRef<THREE.Group>(null);
  const spinY      = useRef(0);
  const cachedMats = useRef<THREE.Material[]>([]);

  useEffect(() => {
    const box   = new THREE.Box3().setFromObject(scene);
    const size  = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const scale = 1.9 / size.y;
    scene.scale.setScalar(scale);
    scene.position.set(-center.x * scale, -box.min.y * scale, -center.z * scale);

    const mats: THREE.Material[] = [];
    const emissiveColor = new THREE.Color('#200010');

    scene.traverse((child) => {
      if (!(child as THREE.Mesh).isMesh) return;
      const mesh = child as THREE.Mesh;
      const ms = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      for (const m of ms as THREE.MeshStandardMaterial[]) {
        m.transparent = true;
        m.depthWrite  = true;
        if (m.emissive !== undefined) {
          m.emissive.copy(emissiveColor);
          m.emissiveIntensity = 0.15;
        }
        m.needsUpdate = true;
        mats.push(m);
      }
    });
    cachedMats.current = mats;
  }, [scene]);

  useFade(groupRef, 0, cachedMats, true);

  useFrame((_, delta) => {
    if (!groupRef.current?.visible) return;
    const gp = scrollStore.globalProgress;
    const pp = phaseProgress(0, gp);
    groupRef.current.scale.setScalar(THREE.MathUtils.lerp(0.98, 1.02, pp));
    spinY.current += delta * 0.25;
    groupRef.current.rotation.y = spinY.current;
  });

  return (
    <group ref={groupRef} position={[-1, 0, 0]} visible={false}>
      <primitive object={scene} />
    </group>
  );
}

// ── Phase 1: Battle Bus ──────────────────────────────────────────────────────
function BattleBusModel() {
  const { scene } = useGLTF('/models/battle-bus.glb', true);
  const groupRef    = useRef<THREE.Group>(null);
  const dropTimer   = useRef(0);
  const hoverOffset = useRef('Bus'.length * 0.731);
  const cachedMats  = useRef<THREE.Material[]>([]);

  useEffect(() => {
    const box   = new THREE.Box3().setFromObject(scene);
    const size  = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const scale = 6 / size.y;
    scene.scale.setScalar(scale);
    scene.position.set(-center.x * scale, -box.min.y * scale, -center.z * scale);

    const mats: THREE.Material[] = [];
    const emissiveColor = new THREE.Color('#1a1000');

    scene.traverse((child) => {
      if (!(child as THREE.Mesh).isMesh) return;
      const mesh = child as THREE.Mesh;
      const ms = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      for (const m of ms as THREE.MeshStandardMaterial[]) {
        m.transparent = true;
        m.depthWrite  = true;
        if (m.emissive !== undefined) {
          m.emissive.copy(emissiveColor);
          m.emissiveIntensity = 0.08;
        }
        m.needsUpdate = true;
        mats.push(m);
      }
    });
    cachedMats.current = mats;
  }, [scene]);

  useFade(groupRef, 1, cachedMats, true);

  useFrame((_, delta) => {
    if (!groupRef.current?.visible) {
      dropTimer.current = 0;
      return;
    }
    const gp = scrollStore.globalProgress;
    const pp = phaseProgress(1, gp);
    groupRef.current.scale.setScalar(THREE.MathUtils.lerp(0.98, 1.02, pp));

    dropTimer.current = Math.min(dropTimer.current + delta, 1.4);
    const dropT = easeOutCubic(dropTimer.current / 1.4);
    const dropY = THREE.MathUtils.lerp(20, 0, dropT);
    hoverOffset.current += delta * 0.8;
    groupRef.current.position.y = dropY + Math.sin(hoverOffset.current) * 0.35;
  });

  return (
    <group ref={groupRef} position={[0, 0, 0]} visible={false}>
      <primitive object={scene} />
    </group>
  );
}

// ── Phase 2: Race Track ──────────────────────────────────────────────────────
function RaceTrackModel() {
  const { scene } = useGLTF('/models/drift_race_track_free.glb', false);
  const groupRef   = useRef<THREE.Group>(null);
  const cachedMats = useRef<THREE.Material[]>([]);

  useEffect(() => {
    const box   = new THREE.Box3().setFromObject(scene);
    const size  = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const scale = 12 / size.y;
    scene.scale.setScalar(scale);
    scene.position.set(-center.x * scale, -box.min.y * scale, -center.z * scale);

    const mats: THREE.Material[] = [];
    const emissiveColor = new THREE.Color('#0a0500');

    scene.traverse((child) => {
      if (!(child as THREE.Mesh).isMesh) return;
      const mesh = child as THREE.Mesh;
      const ms = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      for (const m of ms as THREE.MeshStandardMaterial[]) {
        m.transparent = true;
        m.depthWrite  = true;
        if (m.emissive !== undefined) {
          m.emissive.copy(emissiveColor);
          m.emissiveIntensity = 0.06;
        }
        m.needsUpdate = true;
        mats.push(m);
      }
    });
    cachedMats.current = mats;
  }, [scene]);

  useFade(groupRef, 2, cachedMats, true);

  useFrame(() => {
    if (!groupRef.current?.visible) return;
    const gp = scrollStore.globalProgress;
    const pp = phaseProgress(2, gp);
    groupRef.current.scale.setScalar(THREE.MathUtils.lerp(0.98, 1.02, pp));
  });

  return (
    <group ref={groupRef} position={[0, 0, 0]} visible={false}>
      <primitive object={scene} />
    </group>
  );
}

// ── Phase 6: Hangar ──────────────────────────────────────────────────────────
function HangarModel() {
  const { scene } = useGLTF('/models/star-destroyer-hangar.glb', true);
  const groupRef   = useRef<THREE.Group>(null);
  const cachedMats = useRef<THREE.Material[]>([]);

  useEffect(() => {
    const box   = new THREE.Box3().setFromObject(scene);
    const size  = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const scale = 22 / size.y;

    scene.scale.setScalar(scale);
    scene.position.set(-center.x * scale, -center.y * scale, -center.z * scale);

    const mats: THREE.Material[] = [];

    scene.traverse((child) => {
      if (!(child as THREE.Mesh).isMesh) return;
      const mesh = child as THREE.Mesh;
      const ms = Array.isArray(mesh.material) ? mesh.material : [mesh.material];

      // Hangar needs MeshBasicMaterial — baked lighting, but it's the only model
      // at x=3000 so no material-format conflicts.
      const newMats: THREE.MeshBasicMaterial[] = [];
      for (const m of ms) {
        const anyMat = m as any;
        const tex: THREE.Texture | null =
          anyMat.map ?? anyMat.emissiveMap ?? anyMat.lightMap ?? anyMat.aoMap ?? null;

        const basicMat = new THREE.MeshBasicMaterial({
          map:  tex,
          side: anyMat.side ?? THREE.FrontSide,
          transparent: true,
          opacity:     1,
          depthWrite:  false,  // restored by useFade when fully opaque
        });

        newMats.push(basicMat);
        mats.push(basicMat);
      }
      mesh.material = newMats.length === 1 ? newMats[0] : newMats;
    });

    cachedMats.current = mats;
  }, [scene]);

  useFade(groupRef, 6, cachedMats, true);

  useFrame(() => {
    if (!groupRef.current?.visible) return;
    const gp = scrollStore.globalProgress;
    const pp = phaseProgress(6, gp);
    groupRef.current.scale.setScalar(THREE.MathUtils.lerp(0.98, 1.02, pp));
  });

  return (
    <group ref={groupRef} position={[3000, 0, 0]} visible={false}>
      <primitive object={scene} />
    </group>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
//  SKYBOX SPHERES — phases 3, 4, 5
// ═════════════════════════════════════════════════════════════════════════════
// Equirectangular JPEG texture on an inverted sphere.
// No GLB, no material format wars, no KHR extensions.

function SkyboxSphere({
  texturePath,
  phaseIndex,
  position,
}: {
  texturePath: string;
  phaseIndex: number;
  position: [number, number, number];
}) {
  const texture = useLoader(THREE.TextureLoader, texturePath);

  // Ensure correct color space and orientation for the panorama
  useEffect(() => {
    texture.colorSpace = THREE.SRGBColorSpace;
    // GLTF textures expect top-left UV origin. TextureLoader defaults to true.
    texture.flipY = false;
    texture.needsUpdate = true;
  }, [texture]);

  // Sphere geometry — created once, reused
  const geometry = useMemo(
    () => new THREE.SphereGeometry(500, 60, 40),
    [],
  );

  // Material ref for useFade
  const matRef    = useRef<THREE.MeshBasicMaterial>(null);
  const groupRef  = useRef<THREE.Group>(null);
  const cachedMats = useRef<THREE.Material[]>([]);

  // Populate cachedMats once the material mounts
  useEffect(() => {
    if (matRef.current) {
      cachedMats.current = [matRef.current];
    }
  }, []);

  useFade(groupRef, phaseIndex, cachedMats, false);

  return (
    <group ref={groupRef} position={position} visible={false}>
      {/* scale={[-1, 1, 1]} flips it inside-out horizontally so text isn't mirrored */}
      <mesh geometry={geometry} scale={[-1, 1, 1]} renderOrder={-10}>
        <meshBasicMaterial
          ref={matRef}
          map={texture}
          side={THREE.BackSide}
          transparent
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
//  MAIN EXPORT
// ═════════════════════════════════════════════════════════════════════════════

export default function CharacterStage() {
  return (
    <>
      {/* GLTF models */}
      <SpiderManModel />
      <BattleBusModel />
      <RaceTrackModel />
      <HangarModel />

      {/* Equirectangular skybox spheres — no GLB, no material wars */}
      <SkyboxSphere
        phaseIndex={3}
        texturePath="/textures/jungle_panorama.jpg"
        position={[0, 0, 0]}
      />
      <SkyboxSphere
        phaseIndex={4}
        texturePath="/textures/clouds_panorama.jpg"
        position={[1000, 0, 0]}
      />
      <SkyboxSphere
        phaseIndex={5}
        texturePath="/textures/forest_panorama.jpg"
        position={[2000, 0, 0]}
      />
    </>
  );
}

// Preload GLTF models (race track excluded — 33 MB, loaded on-demand)
useGLTF.preload('/models/spider-man_symbiote.glb', false);
useGLTF.preload('/models/battle-bus.glb', true);
useGLTF.preload('/models/star-destroyer-hangar.glb', true);
