'use client';

import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { scrollStore } from '@/lib/scrollStore';
import type { ModelConfig } from '@/config/models';

interface ModelLoaderProps extends ModelConfig {}

export default function ModelLoader({
  path,
  position,
  scale,
  rotation,
  scrollBehavior,
}: ModelLoaderProps) {
  const { scene } = useGLTF(path);
  const groupRef = useRef<THREE.Group>(null);
  const currentRotY = useRef(0);

  useEffect(() => {
    useGLTF.preload(path);
  }, [path]);

  useFrame(() => {
    if (!groupRef.current) return;

    if (scrollBehavior === 'rotate') {
      const target = scrollStore.globalProgress * Math.PI * 2;
      currentRotY.current = THREE.MathUtils.lerp(currentRotY.current, target, 0.08);
      groupRef.current.rotation.y = currentRotY.current;
    } else if (scrollBehavior === 'parallax') {
      const targetY = position[1] + scrollStore.globalProgress * -8;
      groupRef.current.position.y = THREE.MathUtils.lerp(
        groupRef.current.position.y,
        targetY,
        0.05
      );
    }
  });

  return (
    <group
      ref={groupRef}
      position={position}
      scale={scale}
      rotation={rotation ? [rotation[0], rotation[1], rotation[2]] : undefined}
    >
      <primitive object={scene} />
    </group>
  );
}
