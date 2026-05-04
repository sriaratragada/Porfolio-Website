'use client';

// ── Procedural Web Strands ────────────────────────────────────────────────────
// Spider-Man is at [2, 2→7, 0]. Building tops at world y≈22 (scale=3.5).
// Wrist = right hand extended upward-right ≈ [3.2, 5.5, 0.3]
// Anchors = tops of distant Manhattan buildings — shoot UPWARD to building crowns
// ─────────────────────────────────────────────────────────────────────────────

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface StrandProps {
  from: THREE.Vector3;
  to: THREE.Vector3;
  sag?: number;
  radius?: number;
  opacity?: number;
  phaseOffset?: number;
}

function Strand({ from, to, sag = 1.0, radius = 0.025, opacity = 0.85, phaseOffset = 0 }: StrandProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  const geo = useMemo(() => {
    const mid = new THREE.Vector3().lerpVectors(from, to, 0.5);
    mid.y -= sag;
    const q1 = new THREE.Vector3().lerpVectors(from, mid, 0.5); q1.y -= sag * 0.25;
    const q2 = new THREE.Vector3().lerpVectors(mid, to, 0.5);   q2.y -= sag * 0.25;
    const curve = new THREE.CatmullRomCurve3([from, q1, mid, q2, to]);
    return new THREE.TubeGeometry(curve, 40, radius, 6, false);
  }, [from, to, sag, radius]);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    meshRef.current.rotation.z = Math.sin(clock.elapsedTime * 0.5 + phaseOffset) * 0.012;
  });

  return (
    <mesh ref={meshRef} geometry={geo}>
      <meshStandardMaterial
        color="#c8dcff"
        roughness={0.05}
        metalness={0.6}
        transparent
        opacity={opacity}
        emissive="#2244aa"
        emissiveIntensity={0.3}
      />
    </mesh>
  );
}

function FineBranches({ origin, tip, count = 6 }: { origin: THREE.Vector3; tip: THREE.Vector3; count?: number }) {
  const branches = useMemo(() => {
    return Array.from({ length: count }, (_, i) => {
      const t = (i + 1) / (count + 1);
      const along = new THREE.Vector3().lerpVectors(origin, tip, t);
      along.y -= 0.9 * Math.sin(Math.PI * t);
      const end = along.clone();
      end.x += (Math.random() * 2 - 1) * 0.8;
      end.y -= 0.2 + Math.random() * 0.35;
      end.z += (Math.random() * 2 - 1) * 0.3;
      return { from: along, to: end };
    });
  }, [origin, tip, count]);

  return (
    <>
      {branches.map((b, i) => (
        <Strand key={i} from={b.from} to={b.to} sag={0.08} radius={0.007} opacity={0.5} phaseOffset={i * 0.9} />
      ))}
    </>
  );
}

export default function WebStrand() {
  // Spider-Man right wrist — arm extended upward-right, shooting web
  const wrist = useMemo(() => new THREE.Vector3(3.2, 5.5, 0.3), []);

  // Building crowns at z≈-4 to -6, y=11–16 (building tops in new scale=3.5 city)
  const anchorLeft    = useMemo(() => new THREE.Vector3(-6, 13, -5), []);  // far left tower
  const anchorRight   = useMemo(() => new THREE.Vector3(10, 11, -4), []);  // far right building
  const anchorCenter  = useMemo(() => new THREE.Vector3( 1, 16, -6), []);  // tall center spire

  return (
    <group>
      {/* Three main web lines from wrist to building anchors */}
      <Strand from={wrist} to={anchorLeft}   sag={1.4} radius={0.028} opacity={0.9}  phaseOffset={0}   />
      <Strand from={wrist} to={anchorRight}  sag={1.1} radius={0.022} opacity={0.85} phaseOffset={1.3} />
      <Strand from={wrist} to={anchorCenter} sag={0.6} radius={0.018} opacity={0.80} phaseOffset={2.5} />

      {/* Fine branching threads off the left strand */}
      <FineBranches origin={wrist} tip={anchorLeft}  count={5} />
      <FineBranches origin={wrist} tip={anchorRight} count={3} />
    </group>
  );
}
