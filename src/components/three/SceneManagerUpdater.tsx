'use client';

import { useFrame } from '@react-three/fiber';
import { scrollStore } from '@/lib/scrollStore';
import { updateSceneManager } from '@/lib/sceneManager';

// Runs at the highest useFrame priority (negative = before default 0).
// Populates sceneManager before any other component's useFrame reads it.
export default function SceneManagerUpdater() {
  useFrame(() => {
    updateSceneManager(scrollStore.globalProgress);
  }, -100); // negative priority = runs first

  return null;
}
