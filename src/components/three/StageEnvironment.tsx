'use client';

// ── Stage Environment ─────────────────────────────────────────────────────────
// Visible during character phases (1-3).
//   • Reflective glowing floor disc with grid lines
//   • 2 slim emissive rings framing the character
//   • Subtle phase-tinted floor glow (low intensity — no color blasting)
// AtmosphereGlow removed — it caused overwhelming color floods.
// PhaseLights kept but at low intensity so they accent rather than dominate.
// ─────────────────────────────────────────────────────────────────────────────

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { scrollStore, PHASES } from '@/lib/scrollStore';

// Per-character accent colors (must match CHAR_TINT in CharacterStage)
// Bus → warm ochre  |  Symbiote → cold steel blue  |  Gojo → deep infinity blue
const PHASE_COLORS = [
  new THREE.Color('#2a1a00'), // Bus      — warm dark ochre
  new THREE.Color('#1a3a6e'), // Symbiote — cold steel blue
  new THREE.Color('#0a0a50'), // Gojo     — deep infinity blue
];

function getPhaseColor(gp: number): THREE.Color {
  if (gp < PHASES[2].start) return PHASE_COLORS[0];
  if (gp < PHASES[3].start) return PHASE_COLORS[1];
  return PHASE_COLORS[2];
}

// ── Glowing floor disc ────────────────────────────────────────────────────────
function FloorDisc() {
  const matRef     = useRef<THREE.MeshStandardMaterial>(null);
  const ringMatRef = useRef<THREE.LineBasicMaterial>(null);

  const gridGeo = useMemo(() => {
    const lines: number[] = [];
    const radii = [1.2, 2.4, 3.6, 5.0, 6.5];
    radii.forEach(r => {
      for (let i = 0; i <= 64; i++) {
        const a = (i / 64) * Math.PI * 2;
        lines.push(Math.cos(a) * r, 0.015, Math.sin(a) * r);
      }
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(lines, 3));
    return g;
  }, []);

  const spokeGeo = useMemo(() => {
    const lines: number[] = [];
    for (let s = 0; s < 16; s++) {
      const a = (s / 16) * Math.PI * 2;
      lines.push(0, 0.015, 0);
      lines.push(Math.cos(a) * 6.5, 0.015, Math.sin(a) * 6.5);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(lines, 3));
    return g;
  }, []);

  useFrame(() => {
    if (!matRef.current || !ringMatRef.current) return;
    const gp    = scrollStore.globalProgress;
    const color = getPhaseColor(gp);
    matRef.current.emissive.lerp(color, 0.04);
    ringMatRef.current.color.lerp(color, 0.04);
  });

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <circleGeometry args={[7, 72]} />
        <meshStandardMaterial
          ref={matRef}
          color="#040608"
          emissive="#06091a"
          emissiveIntensity={0.6}
          metalness={0.95}
          roughness={0.1}
        />
      </mesh>
      <lineSegments geometry={spokeGeo}>
        <lineBasicMaterial ref={ringMatRef} color="#111833" transparent opacity={0.4} />
      </lineSegments>
      <lineSegments geometry={gridGeo}>
        <lineBasicMaterial color="#111833" transparent opacity={0.22} />
      </lineSegments>
    </group>
  );
}

// ── Thin framing rings ────────────────────────────────────────────────────────
function BackdropRing({ radius, y, zPos, speed, initialAngle }: {
  radius: number; y: number; zPos: number; speed: number; initialAngle: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const matRef  = useRef<THREE.MeshStandardMaterial>(null);
  const rot     = useRef(initialAngle);

  const geo = useMemo(() => new THREE.TorusGeometry(radius, 0.012, 6, 80), [radius]);

  useFrame((_, delta) => {
    if (!meshRef.current || !matRef.current) return;
    rot.current += delta * speed;
    meshRef.current.rotation.z = rot.current;
    meshRef.current.rotation.x = Math.sin(rot.current * 0.3) * 0.1;
  });

  return (
    <mesh ref={meshRef} position={[0, y, zPos]} geometry={geo}>
      <meshStandardMaterial
        ref={matRef}
        color="#050810"
        emissive="#1a2a55"
        emissiveIntensity={0.5}
        transparent
        opacity={0.45}
        depthWrite={false}
      />
    </mesh>
  );
}

// ── Subtle accent lights ──────────────────────────────────────────────────────
// Low intensity — enough to tint the character's shadows, not flood the scene.
function PhaseLights() {
  const light1Ref = useRef<THREE.PointLight>(null);
  const light2Ref = useRef<THREE.PointLight>(null);

  useFrame(() => {
    if (!light1Ref.current || !light2Ref.current) return;
    const gp    = scrollStore.globalProgress;
    const color = getPhaseColor(gp);

    light1Ref.current.color.lerp(color, 0.03);
    light2Ref.current.color.lerp(color, 0.03);

    const pulse = 0.8 + Math.sin(Date.now() * 0.0008) * 0.2;
    light1Ref.current.intensity = 1.2 * pulse;
    light2Ref.current.intensity = 0.8 * pulse;
  });

  return (
    <>
      <pointLight ref={light1Ref} position={[0, -1.5, 2]}  color="#6a0a14" intensity={1.2} distance={12} decay={2} />
      <pointLight ref={light2Ref} position={[0,  4,  -6]}  color="#0d3a66" intensity={0.8} distance={16} decay={2} />
    </>
  );
}

// ── Stage visibility wrapper ──────────────────────────────────────────────────
export default function StageEnvironment() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (!groupRef.current) return;
    const gp = scrollStore.globalProgress;
    groupRef.current.visible = gp > PHASES[1].start - 0.02;
  });

  return (
    <group ref={groupRef} visible={false}>
      <FloorDisc />
      <BackdropRing radius={2.8} y={3.0} zPos={-2.5} speed={0.07}  initialAngle={0} />
      <BackdropRing radius={2.0} y={4.8} zPos={-1.8} speed={-0.05} initialAngle={2.4} />
      <PhaseLights />
    </group>
  );
}
