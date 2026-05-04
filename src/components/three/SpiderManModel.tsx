'use client';

import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { scrollStore } from '@/lib/scrollStore';

// With Manhattan roof tops at world y=3.2:
// Spider-Man feet at y=2.2 → sits slightly inside the roof height range
// (different buildings have different heights — he's on a medium-height rooftop)
// His height of 4.5 puts his head at y=6.7, clearly above the skyline.
// Offset X=2 keeps the left half of the screen open for hero text.

const MODEL_PATH    = '/models/spider-man_symbiote.glb';
const TARGET_HEIGHT = 5;    // taller — more prominent against city
const PERCH_X       = 2.0;
const PERCH_Y       = 2.0;  // feet planted on rooftop

export default function SpiderManModel() {
  const { scene } = useGLTF(MODEL_PATH);
  const pivotRef  = useRef<THREE.Group>(null);
  const modelRef  = useRef<THREE.Group>(null);
  const idleSwayY = useRef(0); // gentle side-to-side idle sway

  useEffect(() => {
    const box         = new THREE.Box3().setFromObject(scene);
    const size        = box.getSize(new THREE.Vector3());
    const scale       = TARGET_HEIGHT / size.y;
    const center      = box.getCenter(new THREE.Vector3());
    scene.scale.setScalar(scale);
    scene.position.set(
      -center.x * scale,
      -box.min.y * scale,   // feet at y=0 of the group
      -center.z * scale
    );
  }, [scene]);

  useFrame(({ clock }, delta) => {
    if (!pivotRef.current || !modelRef.current) return;

    // Idle: gentle Y-axis sway — like Spider-Man shifting weight on the rooftop
    idleSwayY.current = THREE.MathUtils.damp(
      idleSwayY.current,
      Math.sin(clock.elapsedTime * 0.4) * 0.06,
      3, delta
    );
    pivotRef.current.rotation.y = idleSwayY.current;

    // Idle float — feet stay near the rooftop, slow breathing bob
    modelRef.current.position.y = PERCH_Y + Math.sin(clock.elapsedTime * 1.1) * 0.08;
  });

  return (
    <group ref={modelRef} position={[PERCH_X, PERCH_Y, 0]}>
      <group ref={pivotRef}>
        <primitive object={scene} />
      </group>
    </group>
  );
}

useGLTF.preload(MODEL_PATH);
