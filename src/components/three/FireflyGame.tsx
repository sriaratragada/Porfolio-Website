'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFrame } from '@react-three/fiber';
import { Html, Float } from '@react-three/drei';
import * as THREE from 'three';
import { scrollStore, phaseOpacity } from '@/lib/scrollStore';
import { savePortfolioProgress } from '@/lib/portfolioScrollMemory';

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
          <div style={{ width: '380px', fontFamily: 'var(--font-space-grotesk)', background: 'rgba(4,4,8,0.92)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.18)', padding: '22px 26px 24px', color: '#fff' }}>
            <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.28em', color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', marginBottom: '14px', paddingBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>{data.title}</p>
            <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginBottom: '10px', letterSpacing: '0.05em' }}>{data.skills}</p>
            <p style={{ fontSize: '13px', fontWeight: 300, lineHeight: 1.7, color: 'rgba(255,255,255,0.8)' }}>{data.desc}</p>
          </div>
        </Html>
      )}
    </group>
  );
}

export function FireflyGame({ phaseIndex = 5 }: { phaseIndex?: number }) {
  const [caughtIds, setCaughtIds] = useState<Set<string>>(new Set());
  const [opacity, setOpacity] = useState(0);
  const router = useRouter();

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
                style={{ fontFamily: 'var(--font-space-grotesk)', display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'rgba(4,4,8,0.92)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.18)', padding: '36px 44px', color: '#fff', cursor: 'pointer', transition: 'border-color 0.2s' }}
                onClick={(e) => {
                  e.stopPropagation();
                  savePortfolioProgress(scrollStore.globalProgress);
                  router.push('/resume');
                }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.5)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)')}
              >
                <div style={{ width: '48px', height: '48px', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                  <svg style={{ width: '24px', height: '24px', color: '#000' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                </div>
                <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.28em', color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', marginBottom: '8px' }}>RESUME UNLOCKED</p>
                <p style={{ fontSize: '13px', fontWeight: 300, color: 'rgba(255,255,255,0.6)' }}>Click to view & download</p>
              </div>
            </Html>
          </group>
        </Float>
      )}
    </group>
  );
}
