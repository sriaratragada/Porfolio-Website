'use client';

// ── Procedural Spider Emblem ──────────────────────────────────────────────────
// Built entirely from Three.js geometry — no file needed.
// A stylized 3D spider: two body segments + 8 curved legs.
// Floats and slowly rotates near Spider-Man's chest area.
// ─────────────────────────────────────────────────────────────────────────────

import { useMemo, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const SPIDER_RED   = '#cc0000';
const SPIDER_DARK  = '#1a0000';
const EMISSIVE_COL = '#440000';

function SpiderBody() {
  return (
    <group>
      {/* Cephalothorax (front body) */}
      <mesh position={[0, 0.08, 0]}>
        <sphereGeometry args={[0.065, 20, 20]} />
        <meshStandardMaterial color={SPIDER_RED} roughness={0.2} metalness={0.8}
          emissive={EMISSIVE_COL} emissiveIntensity={0.6} />
      </mesh>
      {/* Abdomen (rear, larger) */}
      <mesh position={[0, -0.11, 0]}>
        <sphereGeometry args={[0.09, 20, 20]} />
        <meshStandardMaterial color={SPIDER_DARK} roughness={0.15} metalness={0.9}
          emissive={EMISSIVE_COL} emissiveIntensity={0.4} />
      </mesh>
      {/* Connecting waist */}
      <mesh position={[0, -0.02, 0]}>
        <sphereGeometry args={[0.028, 12, 12]} />
        <meshStandardMaterial color={SPIDER_RED} roughness={0.3} metalness={0.7} />
      </mesh>
    </group>
  );
}

interface LegProps {
  side: 1 | -1;
  index: number; // 0–3
}

function SpiderLeg({ side, index }: LegProps) {
  // 4 legs per side, spread from front to back
  const baseAngles = [-0.55, -0.2, 0.15, 0.5]; // radians, spread around body
  const angle = baseAngles[index];
  const length = [0.26, 0.28, 0.27, 0.25][index];
  const droop  = [0.06, 0.08, 0.09, 0.07][index];

  const geo = useMemo(() => {
    const origin = new THREE.Vector3(side * 0.06, angle * 0.15, 0);
    const ctrl1  = new THREE.Vector3(side * (0.12 + index * 0.02), angle * 0.1 - 0.04, 0.01);
    const tip    = new THREE.Vector3(
      side * (length + 0.1),
      angle * 0.05 - droop - 0.05,
      (index - 1.5) * 0.04
    );
    const curve = new THREE.CatmullRomCurve3([origin, ctrl1, tip]);
    return new THREE.TubeGeometry(curve, 12, 0.008, 5, false);
  }, [side, angle, length, droop, index]);

  return (
    <mesh geometry={geo}>
      <meshStandardMaterial
        color={SPIDER_RED}
        roughness={0.2}
        metalness={0.85}
        emissive={EMISSIVE_COL}
        emissiveIntensity={0.3}
      />
    </mesh>
  );
}

export default function SpiderEmblem() {
  const groupRef  = useRef<THREE.Group>(null);
  const pivotRef  = useRef<THREE.Group>(null);

  useEffect(() => {
    // Start with a slight random rotation
    if (pivotRef.current) {
      pivotRef.current.rotation.y = Math.random() * Math.PI * 2;
    }
  }, []);

  useFrame(({ clock }) => {
    if (!groupRef.current || !pivotRef.current) return;
    // Slow spin
    pivotRef.current.rotation.y = clock.elapsedTime * 0.4;
    // Gentle float
    groupRef.current.position.y = 7.5 + Math.sin(clock.elapsedTime * 0.8) * 0.18;
  });

  return (
    // Position: above Spider-Man's head, slightly in front
    // scale=14: body spheres ~0.91 units diameter, legs ~0.112 wide → visible at 18 units distance
    <group ref={groupRef} position={[0.5, 7.5, 1.5]} scale={14}>
      <group ref={pivotRef}>
        <SpiderBody />
        {/* 4 legs on each side */}
        {([0, 1, 2, 3] as const).map(i => (
          <SpiderLeg key={`L${i}`} side={-1} index={i} />
        ))}
        {([0, 1, 2, 3] as const).map(i => (
          <SpiderLeg key={`R${i}`} side={1} index={i} />
        ))}
      </group>
    </group>
  );
}
