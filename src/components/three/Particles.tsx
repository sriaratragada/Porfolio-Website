'use client';

// ── City Atmosphere Particles ─────────────────────────────────────────────────
// 200 floating ember / dust motes drifting upward through the city.
// Warm amber + cool blue mix evokes glowing windows and street lights.
// ─────────────────────────────────────────────────────────────────────────────

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const COUNT = 200;

export default function Particles() {
  const ref = useRef<THREE.Points>(null);

  const { positions, velocities } = useMemo(() => {
    const positions  = new Float32Array(COUNT * 3);
    const velocities = new Float32Array(COUNT);
    for (let i = 0; i < COUNT; i++) {
      positions[i * 3]     = (Math.random() - 0.5) * 30;  // x: -15 → +15
      positions[i * 3 + 1] = Math.random() * 30 - 5;      // y: -5  → +25
      positions[i * 3 + 2] = Math.random() * 10 - 12;     // z: -12 → -2
      velocities[i]        = 0.005 + Math.random() * 0.01; // gentle upward drift
    }
    return { positions, velocities };
  }, []);

  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return g;
  }, [positions]);

  useFrame(() => {
    if (!ref.current) return;
    const pos = ref.current.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < COUNT; i++) {
      pos[i * 3 + 1] += velocities[i];
      if (pos[i * 3 + 1] > 30) pos[i * 3 + 1] = -5; // wrap back to bottom
    }
    ref.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={ref} geometry={geo}>
      <pointsMaterial
        size={0.06}
        color="#ffaa44"
        transparent
        opacity={0.55}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}
