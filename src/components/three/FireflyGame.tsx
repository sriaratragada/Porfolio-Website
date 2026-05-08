'use client';

import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, Float } from '@react-three/drei';
import * as THREE from 'three';
import { scrollStore, phaseOpacity } from '@/lib/scrollStore';

const FIREFLIES = [
  { id: 'python', color: '#3b82f6', title: 'PYTHON & AI/ML', skills: 'RAG, ChromaDB, OpenAI', desc: 'Built end-to-end NLP pipelines and vector-based semantic retrieval systems reducing zero-result queries by 35%.' },
  { id: 'cpp', color: '#ef4444', title: 'LOW-LATENCY C++', skills: 'C++, CMake, Multi-threading', desc: 'Engineered high-frequency order matching engines with deterministic sub-microsecond performance using lock-free data structures.' },
  { id: 'web', color: '#10b981', title: 'FULL-STACK WEB', skills: 'React, Node.js, MongoDB, Socket.IO', desc: 'Developed real-time, scalable multiplayer platforms and high-fidelity 3D web applications.' },
  { id: 'cloud', color: '#eab308', title: 'DEVSECOPS & CLOUD', skills: 'AWS ECS, Docker, GitHub Actions', desc: 'Architected containerized cloud deployments, optimized EC2 compute costs by 20%, and automated CI/CD pipelines.' },
];

function Firefly({ data, index, onCatch, isCaught, phaseIndex }: { data: any, index: number, onCatch: () => void, isCaught: boolean, phaseIndex: number }) {
  const groupRef = useRef<THREE.Group>(null);
  
  // Randomize movement params based on index
  const speed = 0.2 + index * 0.15;
  const radius = 6 + index * 0.5;
  const yOffset = (index - 1.5) * 1.5;
  const timeOffset = index * 2000;

  useFrame((state) => {
    if (!groupRef.current) return;
    
    // Performance optimization: don't animate if phase is invisible
    const gp = scrollStore.globalProgress;
    const opacity = phaseOpacity(phaseIndex, gp);
    if (opacity === 0) return;

    if (!isCaught) {
      // Complex organic movement orbiting the camera at origin
      const t = state.clock.elapsedTime + timeOffset;
      const x = Math.sin(t * speed) * radius;
      const z = Math.cos(t * speed * 0.8) * radius;
      const y = yOffset + Math.sin(t * 1.5) * 1.0;
      
      groupRef.current.position.set(x, y, z);
      // Make it face the center
      groupRef.current.lookAt(0, 0, 0);
    }
  });

  return (
    <group ref={groupRef} position={[Math.sin(index)*radius, yOffset, Math.cos(index)*radius]}>
      {!isCaught && (
        // The floating orb
        <Html center transform sprite zIndexRange={[100, 0]}>
          <button 
            onClick={(e) => { e.stopPropagation(); onCatch(); }}
            className="w-8 h-8 rounded-full cursor-pointer transition-transform hover:scale-125 hover:brightness-150"
            style={{ 
              backgroundColor: data.color, 
              boxShadow: `0 0 20px ${data.color}, 0 0 40px ${data.color}`,
              border: '2px solid white',
              animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
            }}
          />
        </Html>
      )}
      
      {/* The caught card */}
      {isCaught && (
        <Html center transform sprite zIndexRange={[100, 0]} scale={0.45}>
          <div className="flex flex-col bg-black/60 backdrop-blur-2xl border border-white/10 rounded-2xl p-6 text-white shadow-[0_16px_40px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.2)] cursor-default transition-all duration-500 ease-out animate-in fade-in zoom-in-90" style={{ width: '380px', fontFamily: 'var(--font-space-grotesk)' }}>
            <h3 className="text-xl font-bold uppercase tracking-widest mb-3" style={{ color: data.color, textShadow: `0 0 20px ${data.color}80` }}>{data.title}</h3>
            <p className="text-sm opacity-70 mb-4">{data.skills}</p>
            <p className="text-sm font-light leading-relaxed text-white/80">{data.desc}</p>
          </div>
        </Html>
      )}
    </group>
  );
}

export function FireflyGame({ phaseIndex = 5 }: { phaseIndex?: number }) {
  const [caughtIds, setCaughtIds] = useState<Set<string>>(new Set());
  const [opacity, setOpacity] = useState(0);

  useFrame(() => {
    const gp = scrollStore.globalProgress;
    const newOpacity = phaseOpacity(phaseIndex, gp);
    if (Math.abs(newOpacity - opacity) > 0.01) {
      setOpacity(newOpacity);
    }
  });

  const handleCatch = (id: string) => {
    setCaughtIds(prev => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  };

  const allCaught = caughtIds.size === FIREFLIES.length;
  
  if (opacity === 0) return null;

  return (
    <group>
      {FIREFLIES.map((ff, i) => (
        <Firefly 
          key={ff.id} 
          data={ff} 
          index={i} 
          isCaught={caughtIds.has(ff.id)} 
          onCatch={() => handleCatch(ff.id)} 
          phaseIndex={phaseIndex}
        />
      ))}

      {/* The massive glowing crystal / Resume button when all caught */}
      {allCaught && (
        <Float floatIntensity={3} speed={1.5} rotationIntensity={0.2}>
          {/* Placed at a fixed position in the photosphere so it feels anchored like a monument */}
          <group position={[0, -1, -6]}>
            <Html center transform sprite zIndexRange={[100, 0]} scale={1.2}>
              <div 
                className="flex flex-col items-center bg-black/80 backdrop-blur-3xl border border-white/20 rounded-3xl p-8 text-white shadow-[0_0_80px_rgba(255,255,255,0.3),inset_0_1px_0_rgba(255,255,255,0.5)] cursor-pointer hover:scale-105 transition-all duration-700 ease-out animate-in zoom-in-50 spin-in-12" 
                style={{ fontFamily: 'var(--font-space-grotesk)' }} 
                onClick={(e) => { e.stopPropagation(); window.location.href = '/resume'; }}
              >
                <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(255,255,255,0.8)]" style={{ animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}>
                  <svg className="w-8 h-8 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                </div>
                <h2 className="text-2xl font-bold uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-white to-white/50 mb-2">Resume Unlocked</h2>
                <p className="text-sm opacity-80">Click to view & download</p>
              </div>
            </Html>
          </group>
        </Float>
      )}
    </group>
  );
}
