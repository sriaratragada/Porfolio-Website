'use client';

import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { AdaptiveDpr, AdaptiveEvents } from '@react-three/drei';
import * as THREE from 'three';
import ManhattanBackground  from './ManhattanBackground';
import CharacterStage       from './CharacterStage';
import StageEnvironment     from './StageEnvironment';
import SceneLighting        from './SceneLighting';
import CameraController     from './CameraController';
import PostProcessingEffects from './PostProcessing';

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
        {/* Atmospheric fog — fades during character phases via CameraController */}
        <fogExp2 attach="fog" args={[0x060810, 0.018]} />

        <SceneLighting />

        {/* Phase 0: Manhattan city zoom-in */}
        <Suspense fallback={null}>
          <ManhattanBackground />
        </Suspense>

        {/* Phase 1-3: Stage environment — floor, rings, atmosphere */}
        <StageEnvironment />

        {/* Phase 1-3: Spinning character models */}
        <Suspense fallback={null}>
          <CharacterStage />
        </Suspense>

        {/* Post-processing — bloom + chromatic aberration */}
        <Suspense fallback={null}>
          <PostProcessingEffects />
        </Suspense>

        {/* Camera animates across all phases */}
        <CameraController />

        <AdaptiveDpr pixelated />
        <AdaptiveEvents />
      </Canvas>
    </div>
  );
}
