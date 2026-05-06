'use client';

import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { AdaptiveDpr, AdaptiveEvents } from '@react-three/drei';
import * as THREE from 'three';
import ManhattanBackground    from './ManhattanBackground';
import CharacterStage         from './CharacterStage';
import SceneLighting          from './SceneLighting';
import CameraController       from './CameraController';
import PhotoSphereControls    from './PhotoSphereControls';
import PostProcessingEffects  from './PostProcessing';

if (typeof window !== 'undefined') {
  const _warn = console.warn.bind(console);
  console.warn = (...args: unknown[]) => {
    const msg = typeof args[0] === 'string' ? args[0] : '';
    if (msg.includes('THREE.Clock') || msg.includes('KHR_materials_pbrSpecularGlossiness')) return;
    _warn(...args);
  };
}

export default function SceneCanvas() {
  return (
    <div className="fixed inset-0 z-0">
      <Canvas
        camera={{ position: [-2, 8, 17], fov: 68 }}
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.45,
          outputColorSpace: THREE.SRGBColorSpace,
          powerPreference: 'high-performance',
        }}
        frameloop="always"
        dpr={[1, 1.5]}
      >
        {/* Atmospheric fog — density animated per-phase by CameraController */}
        <fogExp2 attach="fog" args={[0x060810, 0.018]} />

        <SceneLighting />

        {/* Phase 0: Manhattan city backdrop */}
        <Suspense fallback={null}>
          <ManhattanBackground />
        </Suspense>

        {/* Phases 0-6: models + skybox spheres */}
        <Suspense fallback={null}>
          <CharacterStage />
        </Suspense>

        {/* Post-processing — bloom + vignette, phase-aware */}
        <Suspense fallback={null}>
          <PostProcessingEffects />
        </Suspense>

        {/* Camera: data-driven, also runs phase state update at priority -100 */}
        <CameraController />

        {/* Photo sphere drag + inertia — active in phases 3, 4, 5 */}
        <PhotoSphereControls />

        <AdaptiveDpr pixelated />
        <AdaptiveEvents />
      </Canvas>
    </div>
  );
}

