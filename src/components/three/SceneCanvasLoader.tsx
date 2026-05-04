'use client';

import dynamic from 'next/dynamic';

// ssr: false must be declared inside a Client Component
const SceneCanvas = dynamic(() => import('./SceneCanvas'), { ssr: false });

export default function SceneCanvasLoader() {
  return <SceneCanvas />;
}
