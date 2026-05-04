'use client';

// ── Procedural Spider Web Disc ────────────────────────────────────────────────
// A circular spider web pattern — radial spokes + concentric ring strands.
// Rendered as a flat disc positioned behind Spider-Man like an aura / halo.
// Slowly rotates and pulses opacity with breathing animation.
//
// Uses EdgesGeometry + lineSegments (no broken index accumulation).
// ─────────────────────────────────────────────────────────────────────────────

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const SPOKES = 12;
const RINGS  = 6;
const RADIUS = 2.4;

// ── Single ring rendered as edge lines on a torus ────────────────────────────
function WebRing({ ringRadius, opacity }: { ringRadius: number; opacity: number }) {
  const geo = useMemo(() => {
    const torus = new THREE.TorusGeometry(ringRadius, 0.007, 4, 64);
    const edges = new THREE.EdgesGeometry(torus, 1);
    torus.dispose();
    return edges;
  }, [ringRadius]);

  return (
    <lineSegments geometry={geo}>
      <lineBasicMaterial color="#aabbee" transparent opacity={opacity} />
    </lineSegments>
  );
}

// ── Single spoke as a 2-point line (no index needed) ─────────────────────────
function WebSpoke({ angle }: { angle: number }) {
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(
        [
          0, 0, 0,
          Math.cos(angle) * RADIUS, Math.sin(angle) * RADIUS, 0,
        ],
        3
      )
    );
    return g;
  }, [angle]);

  return (
    <lineSegments geometry={geo}>
      <lineBasicMaterial color="#88aadd" transparent opacity={0.55} />
    </lineSegments>
  );
}

export default function WebDisc() {
  const groupRef = useRef<THREE.Group>(null);
  const matRefs  = useRef<THREE.LineBasicMaterial[]>([]);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    // Very slow clockwise rotation
    groupRef.current.rotation.z = clock.elapsedTime * 0.05;
    // Breathing opacity pulse on all ring materials
    const pulse = 0.35 + Math.sin(clock.elapsedTime * 0.9) * 0.15;
    for (const mat of matRefs.current) {
      if (mat) mat.opacity = pulse;
    }
  });

  const spokeAngles = useMemo(
    () => Array.from({ length: SPOKES }, (_, s) => (s / SPOKES) * Math.PI * 2),
    []
  );

  const ringRadii = useMemo(
    () => Array.from({ length: RINGS }, (_, r) => ((r + 1) / RINGS) * RADIUS),
    []
  );

  return (
    // Positioned behind and around Spider-Man — large scale, slightly tilted
    <group
      ref={groupRef}
      position={[2.0, 4.5, -2.5]}
      rotation={[0.15, 0, 0]}
      scale={1.0}
    >
      {spokeAngles.map((angle, i) => (
        <WebSpoke key={`spoke-${i}`} angle={angle} />
      ))}
      {ringRadii.map((r, i) => (
        <WebRing key={`ring-${i}`} ringRadius={r} opacity={0.4 + i * 0.02} />
      ))}
    </group>
  );
}
