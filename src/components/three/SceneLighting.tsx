'use client';

// ── Scene Lighting ────────────────────────────────────────────────────────────
// Each phase has its own lighting target (key intensity, fill colour, rim colour).
// useFrame lerps all lights toward the current phase's target every frame.
// ─────────────────────────────────────────────────────────────────────────────

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { scrollStore } from '@/lib/scrollStore';
import { sceneManager } from '@/lib/sceneManager';

interface LightingTarget {
  ambientIntensity: number;
  keyIntensity:     number;
  fillIntensity:    number;
  rimIntensity:     number;
  fillColor:        number;
  rimColor:         number;
  redHeartbeat:     boolean; // Manhattan only
  cityGlow:         boolean; // Manhattan only
  fogDensity:       number;
}

const PHASE_LIGHTING: LightingTarget[] = [
  // Phase 0 — Manhattan: moonlight + red symbiote heartbeat + city glow
  { ambientIntensity: 7,   keyIntensity: 0,   fillIntensity: 0,   rimIntensity: 0,
    fillColor: 0xffcc88,   rimColor: 0x1028a0,  redHeartbeat: true,  cityGlow: true,  fogDensity: 0.018 },
  // Phase 1 — Battle Bus: warm studio portrait
  { ambientIntensity: 5,   keyIntensity: 6.5, fillIntensity: 3.2, rimIntensity: 5.0,
    fillColor: 0xc8d8ff,   rimColor: 0x6688ff,  redHeartbeat: false, cityGlow: false, fogDensity: 0.002 },
  // Phase 2 — Race Track: warm dusty afternoon
  { ambientIntensity: 6,   keyIntensity: 5.0, fillIntensity: 2.5, rimIntensity: 3.5,
    fillColor: 0xff9955,   rimColor: 0x884422,  redHeartbeat: false, cityGlow: false, fogDensity: 0.001 },
  // Phase 3 — Bedroom: cool ambient night
  { ambientIntensity: 6,   keyIntensity: 4.0, fillIntensity: 2.0, rimIntensity: 2.5,
    fillColor: 0xaabbff,   rimColor: 0x334488,  redHeartbeat: false, cityGlow: false, fogDensity: 0.0002 },
  // Phase 4 — Clouds: bright sky, minimal scene lighting (skybox self-illuminates)
  { ambientIntensity: 9,   keyIntensity: 0,   fillIntensity: 0,   rimIntensity: 0,
    fillColor: 0xffffff,   rimColor: 0xeeeeff,  redHeartbeat: false, cityGlow: false, fogDensity: 0.00015 },
  // Phase 5 — Enchanted Forest: deep green ambient, self-illuminated skybox
  { ambientIntensity: 6,   keyIntensity: 0,   fillIntensity: 0,   rimIntensity: 0,
    fillColor: 0x44ff88,   rimColor: 0x226644,  redHeartbeat: false, cityGlow: false, fogDensity: 0.00035 },
  // Phase 6 — Star Destroyer Hangar: cold steel, blue-grey fill
  { ambientIntensity: 4,   keyIntensity: 3.0, fillIntensity: 1.5, rimIntensity: 2.0,
    fillColor: 0x8899cc,   rimColor: 0x334477,  redHeartbeat: false, cityGlow: false, fogDensity: 0.0002 },
];

const _fillColorTarget = new THREE.Color();
const _rimColorTarget  = new THREE.Color();

export default function SceneLighting() {
  const ambientRef  = useRef<THREE.AmbientLight>(null);
  const redLightRef = useRef<THREE.PointLight>(null);
  const blueLightRef= useRef<THREE.PointLight>(null);
  const keyLightRef = useRef<THREE.DirectionalLight>(null);
  const fillLightRef= useRef<THREE.DirectionalLight>(null);
  const rimLightRef = useRef<THREE.DirectionalLight>(null);

  useFrame(({ clock }, delta) => {
    const t      = clock.elapsedTime;
    const phase  = sceneManager.activePhase;
    const target = PHASE_LIGHTING[phase] ?? PHASE_LIGHTING[0];
    const SPEED  = 3; // lerp speed for transitions

    // ── Ambient ────────────────────────────────────────────────────────────
    if (ambientRef.current) {
      ambientRef.current.intensity = THREE.MathUtils.damp(
        ambientRef.current.intensity, target.ambientIntensity, SPEED, delta,
      );
    }

    // ── Manhattan-only heartbeat lights ────────────────────────────────────
    if (redLightRef.current) {
      const targetInt = target.redHeartbeat ? (6 + Math.sin(t * 2.1) * 5) : 0;
      redLightRef.current.intensity = THREE.MathUtils.damp(
        redLightRef.current.intensity, targetInt, SPEED, delta,
      );
    }
    if (blueLightRef.current) {
      const targetInt = target.cityGlow ? (18 + Math.sin(t * 0.6) * 6) : 0;
      blueLightRef.current.intensity = THREE.MathUtils.damp(
        blueLightRef.current.intensity, targetInt, SPEED, delta,
      );
    }

    // ── Studio / scene lights ──────────────────────────────────────────────
    if (keyLightRef.current) {
      keyLightRef.current.intensity = THREE.MathUtils.damp(
        keyLightRef.current.intensity, target.keyIntensity, SPEED, delta,
      );
    }
    if (fillLightRef.current) {
      fillLightRef.current.intensity = THREE.MathUtils.damp(
        fillLightRef.current.intensity, target.fillIntensity, SPEED, delta,
      );
      _fillColorTarget.set(target.fillColor);
      fillLightRef.current.color.lerp(_fillColorTarget, 2 * delta);
    }
    if (rimLightRef.current) {
      rimLightRef.current.intensity = THREE.MathUtils.damp(
        rimLightRef.current.intensity, target.rimIntensity, SPEED, delta,
      );
      _rimColorTarget.set(target.rimColor);
      rimLightRef.current.color.lerp(_rimColorTarget, 2 * delta);
    }
  });

  return (
    <>
      {/* ── Always-on ambient ─────────────────────────────────────────── */}
      <ambientLight ref={ambientRef} color={0x1a1e38} intensity={7} />

      {/* ── Moonlight (always on — consistent sky source) ─────────────── */}
      <directionalLight position={[-8, 35, 10]} color={0xd0e8ff} intensity={4.5} />

      {/* ── Warm building window glow ─────────────────────────────────── */}
      <directionalLight position={[12, -5, 6]} color={0xffcc88} intensity={1.4} />

      {/* ── Manhattan: symbiote red heartbeat ─────────────────────────── */}
      <pointLight ref={redLightRef} position={[2.5, 4, 5]}  color={0xff1020}
        intensity={11} distance={18} decay={2} />

      {/* ── Manhattan: city upward glow ───────────────────────────────── */}
      <pointLight ref={blueLightRef} position={[0, -8, -4]} color={0x1028a0}
        intensity={24} distance={60} decay={1.2} />

      {/* ── Key light — phases 1-3, 6 ─────────────────────────────────── */}
      <directionalLight ref={keyLightRef} position={[-5, 10, 7]}
        color={0xfff8f0} intensity={0} castShadow={false} />

      {/* ── Fill light ────────────────────────────────────────────────── */}
      <directionalLight ref={fillLightRef} position={[6, 3, 5]}
        color={0xc8d8ff} intensity={0} />

      {/* ── Rim / back light ──────────────────────────────────────────── */}
      <directionalLight ref={rimLightRef} position={[0, 8, -10]}
        color={0x6688ff} intensity={0} />
    </>
  );
}
