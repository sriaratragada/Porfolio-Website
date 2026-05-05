'use client';

import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { AdaptiveDpr, AdaptiveEvents } from '@react-three/drei';
import * as THREE from 'three';
import ManhattanBackground   from './ManhattanBackground';
import CharacterStage        from './CharacterStage';
import SceneLighting         from './SceneLighting';
import CameraController      from './CameraController';
import PhotoSphereControls   from './PhotoSphereControls';
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

        {/* Phase 1-3: Environment models */}
        <Suspense fallback={null}>
          <CharacterStage />
        </Suspense>

        {/* Post-processing — bloom + chromatic aberration */}
        <Suspense fallback={null}>
          <PostProcessingEffects />
        </Suspense>

        {/* Camera animates across all phases */}
        <CameraController />

        {/* Photo sphere drag controls — active in phases 4 and 5 */}
        <PhotoSphereControls />

        <AdaptiveDpr pixelated />
        <AdaptiveEvents />
      </Canvas>
    </div>
  );
}
