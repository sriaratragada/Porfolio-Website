'use client';

// ── Suit Wall ─────────────────────────────────────────────────────────────────
// Hall-of-armor display pods visible during Spider-Man phases (1 & 2).
// Seven illuminated pods arc behind the main character. Each pod:
//   • Edge-frame glow  •  Dark glass fill  •  Humanoid silhouette
//   •  Pedestal base   •  Floor disc glow
// Phase 1 → red  |  Phase 2 → blue
// ─────────────────────────────────────────────────────────────────────────────

import { useRef, useMemo, MutableRefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { scrollStore, PHASES, phaseOpacity } from '@/lib/scrollStore';

const POD_CONFIGS: Array<{ x: number; z: number; s: number; delay: number }> = [
  { x: -6.2, z: -3.2, s: 0.80, delay: 0.0 },
  { x: -4.2, z: -4.4, s: 0.90, delay: 0.4 },
  { x: -2.2, z: -5.2, s: 0.95, delay: 0.8 },
  { x:  0.0, z: -5.5, s: 1.00, delay: 1.2 },
  { x:  2.2, z: -5.2, s: 0.95, delay: 0.8 },
  { x:  4.2, z: -4.4, s: 0.90, delay: 0.4 },
  { x:  6.2, z: -3.2, s: 0.80, delay: 0.0 },
];

// Match CharacterStage CHAR_TINT colors for consistency
const SYMBIOTE_BLUE = new THREE.Color('#1a3a6e'); // Symbiote — cold steel blue
const CLASSIC_RED   = new THREE.Color('#6e1a1a'); // Classic  — deep crimson

function getPodColor(gp: number): THREE.Color {
  return gp < PHASES[2].start ? SYMBIOTE_BLUE : CLASSIC_RED;
}

function DisplayPod({
  position, s, delay, sharedColor,
}: {
  position: [number, number, number];
  s: number;
  delay: number;
  sharedColor: MutableRefObject<THREE.Color>;
}) {
  const frameRef = useRef<THREE.LineBasicMaterial>(null);
  const bodyRef  = useRef<THREE.MeshStandardMaterial>(null);
  const discRef  = useRef<THREE.MeshBasicMaterial>(null);

  const W = 0.80 * s;
  const H = 2.20 * s;
  const D = 0.18 * s;

  // Edge frame geometry
  const frameGeo = useMemo(
    () => new THREE.EdgesGeometry(new THREE.BoxGeometry(W, H, D)),
    [W, H, D]
  );

  useFrame(() => {
    const col   = sharedColor.current;
    const pulse = 0.55 + Math.sin(Date.now() * 0.0014 + delay) * 0.35;
    if (frameRef.current) frameRef.current.color.copy(col);
    if (bodyRef.current)  { bodyRef.current.emissive.copy(col); bodyRef.current.emissiveIntensity = pulse * 1.5; }
    if (discRef.current)  discRef.current.color.copy(col);
  });

  const yCenter = H / 2;

  return (
    <group position={position}>
      {/* Outer glowing edge frame — sits at z=0 */}
      <lineSegments geometry={frameGeo} position={[0, yCenter, 0]}>
        <lineBasicMaterial ref={frameRef} color="#ff1a2e" transparent opacity={0.9} />
      </lineSegments>

      {/* Dark glass fill — slightly inset so it doesn't z-fight with frame */}
      <mesh position={[0, yCenter, 0]}>
        <boxGeometry args={[W * 0.96, H * 0.97, D * 0.5]} />
        <meshStandardMaterial
          color="#020510"
          transparent
          opacity={0.78}
          depthWrite={false}
          polygonOffset
          polygonOffsetFactor={1}
          polygonOffsetUnits={1}
        />
      </mesh>

      {/* Humanoid silhouette — clearly in front of glass (z = D*0.6 forward) */}
      <mesh position={[0, yCenter * 1.02, D * 0.6]}>
        <capsuleGeometry args={[0.13 * s, 0.6 * s, 4, 8]} />
        <meshStandardMaterial
          ref={bodyRef}
          color="#000"
          emissive="#ff1a2e"
          emissiveIntensity={1.4}
          transparent
          opacity={0.85}
          depthWrite={false}
        />
      </mesh>

      {/* Pedestal — no transparency, so no z-fighting */}
      <mesh position={[0, 0.10 * s, 0]}>
        <cylinderGeometry args={[0.28 * s, 0.36 * s, 0.20 * s, 8]} />
        <meshStandardMaterial color="#080c18" metalness={0.9} roughness={0.15} />
      </mesh>

      {/* Floor glow disc — barely above y=0 to avoid z-fighting with floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <circleGeometry args={[0.30 * s, 16]} />
        <meshBasicMaterial
          ref={discRef}
          color="#ff1a2e"
          transparent
          opacity={0.45}
          depthWrite={false}
          polygonOffset
          polygonOffsetFactor={-1}
          polygonOffsetUnits={-1}
        />
      </mesh>
    </group>
  );
}

export default function SuitWall() {
  const groupRef    = useRef<THREE.Group>(null);
  const sharedColor = useRef<THREE.Color>(new THREE.Color('#ff1a2e'));

  useFrame(() => {
    if (!groupRef.current) return;
    const gp = scrollStore.globalProgress;
    const op = Math.max(phaseOpacity(1, gp, 0.06), phaseOpacity(2, gp, 0.06));
    groupRef.current.visible = op > 0.01;
    sharedColor.current.lerp(getPodColor(gp), 0.04);
  });

  return (
    <group ref={groupRef} visible={false}>
      {POD_CONFIGS.map((cfg, i) => (
        <DisplayPod
          key={i}
          position={[cfg.x, 0, cfg.z]}
          s={cfg.s}
          delay={cfg.delay}
          sharedColor={sharedColor as MutableRefObject<THREE.Color>}
        />
      ))}
    </group>
  );
}
