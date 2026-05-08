'use client';

// ── Character Stage (v3) ──────────────────────────────────────────────────────
// Added InfoHotspot for interactive 3D UX.
// ─────────────────────────────────────────────────────────────────────────────

import { useRef, useEffect, useMemo, useState } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import { useGLTF, Html, Float } from '@react-three/drei';
import * as THREE from 'three';
import { scrollStore, phaseOpacity, phaseProgress } from '@/lib/scrollStore';
import { FireflyGame } from './FireflyGame';

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function InfoHotspot({ position, title, children, rotation, phaseIndex, htmlScale = 1 }: { position: [number, number, number], title: string, children: React.ReactNode, rotation?: [number, number, number], phaseIndex: number, htmlScale?: number }) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  // Track opacity in state so we can fully unmount the Html component when it's totally hidden
  const [opacity, setOpacity] = useState(0);

  useFrame(() => {
    const gp = scrollStore.globalProgress;
    // fadeSize=0.02 means it fades in completely within the first 2% of the phase, appearing very early!
    const newOpacity = phaseOpacity(phaseIndex, gp, 0.02);

    // Only update state if it crossed the 0 threshold to avoid excessive re-renders
    if ((newOpacity > 0 && opacity === 0) || (newOpacity === 0 && opacity > 0)) {
      setOpacity(newOpacity);
    }

    const pEvents = newOpacity > 0.1 ? 'auto' : 'none';
    if (triggerRef.current) {
      triggerRef.current.style.opacity = newOpacity.toString();
      triggerRef.current.style.pointerEvents = pEvents;
    }
    if (cardRef.current) {
      cardRef.current.style.opacity = newOpacity.toString();
      cardRef.current.style.pointerEvents = pEvents;
    }
  });

  if (opacity === 0) return null; // Completely remove from DOM when hidden!

  return (
    <group position={position} rotation={rotation || [0, 0, 0]}>
      <Float floatIntensity={1.5} speed={2.5} rotationIntensity={0.1}>
        {/* Interactive Trigger */}
        {!isOpen && (
          <Html center transform sprite zIndexRange={[100, 0]} scale={htmlScale}>
            <div ref={triggerRef} style={{ transition: 'opacity 0.1s' }}>
              <button
                onClick={(e) => { e.stopPropagation(); setIsOpen(true); }}
                className="flex items-center gap-3 px-5 py-2.5 bg-gradient-to-r from-[#e62429] to-[#ff4444] hover:from-[#ff4444] hover:to-[#e62429] text-white rounded-full backdrop-blur-md border border-red-300/30 transition-all cursor-pointer shadow-[0_0_30px_rgba(230,36,41,0.5)] uppercase tracking-widest text-xs font-bold"
                style={{ fontFamily: 'var(--font-space-grotesk)' }}
              >
                <span>{title}</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
              </button>
            </div>
          </Html>
        )}

        {/* 3D HTML Card */}
        {isOpen && (
          <Html center transform sprite position={[0, 0, 0]} style={{ transition: 'all 0.3s' }} zIndexRange={[100, 0]} scale={htmlScale}>
            <div 
              ref={cardRef}
              className="flex flex-col bg-black/60 backdrop-blur-2xl border border-white/10 rounded-2xl p-6 text-white shadow-[0_16px_40px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.2)]"
              style={{ width: '380px', fontFamily: 'var(--font-space-grotesk)' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-5 border-b border-white/10 pb-3">
                <h3 className="text-xl font-bold uppercase tracking-widest bg-gradient-to-br from-white to-white/50 bg-clip-text text-transparent">{title}</h3>
                <button onClick={(e) => { e.stopPropagation(); setIsOpen(false); }} className="text-white/40 hover:text-white transition-colors cursor-pointer p-1 bg-white/5 rounded-full hover:bg-white/10">✕</button>
              </div>
              <div className="text-sm font-light leading-relaxed text-white/80">
                {children}
              </div>
            </div>
          </Html>
        )}
      </Float>
    </group>
  );
}

// ── useFade — ref-based material fade ────────────────────────────────────────

function useFade(
  groupRef: React.RefObject<THREE.Group | null>,
  phaseIndex: number,
  matsRef: React.RefObject<THREE.Material[]>,
  restoreDepthWrite: boolean,
) {
  const lastOpacity = useRef(-1);
  const wasVisible = useRef(false);

  useFrame(() => {
    if (!groupRef.current) return;
    const gp = scrollStore.globalProgress;
    const opacity = phaseOpacity(phaseIndex, gp, 0.06);

    const nowVisible = opacity > 0.001;
    if (
      wasVisible.current !== nowVisible ||
      (nowVisible && Math.abs(opacity - lastOpacity.current) > 0.002)
    ) {
      lastOpacity.current = opacity;
      wasVisible.current = nowVisible;
      groupRef.current.visible = nowVisible;

      for (const m of matsRef.current) {
        m.opacity = opacity;
        if (restoreDepthWrite) {
          m.depthWrite = opacity > 0.95;
        }
      }
    }
  });
}

// ═════════════════════════════════════════════════════════════════════════════
//  GLTF MODELS — phases 0, 1, 2, 6
// ═════════════════════════════════════════════════════════════════════════════

// ── Phase 0: Spider-Man ──────────────────────────────────────────────────────
function SpiderManModel() {
  const { scene } = useGLTF('/models/spider-man_symbiote.glb', false);
  const wrapperRef = useRef<THREE.Group>(null);
  const modelRef = useRef<THREE.Group>(null);
  const spinY = useRef(0);
  const cachedMats = useRef<THREE.Material[]>([]);

  useEffect(() => {
    const box = new THREE.Box3().setFromObject(scene);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const scale = 1.9 / size.y;
    scene.scale.setScalar(scale);
    scene.position.set(-center.x * scale, -box.min.y * scale, -center.z * scale);

    const mats: THREE.Material[] = [];
    const emissiveColor = new THREE.Color('#200010');

    scene.traverse((child) => {
      if (!(child as THREE.Mesh).isMesh) return;
      const mesh = child as THREE.Mesh;
      const ms = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      for (const m of ms as THREE.MeshStandardMaterial[]) {
        m.transparent = true;
        m.depthWrite = true;
        if (m.emissive !== undefined) {
          m.emissive.copy(emissiveColor);
          m.emissiveIntensity = 0.15;
        }
        m.needsUpdate = true;
        mats.push(m);
      }
    });
    cachedMats.current = mats;
  }, [scene]);

  useFade(wrapperRef, 0, cachedMats, true);

  useFrame((_, delta) => {
    if (!wrapperRef.current?.visible) return;
    const gp = scrollStore.globalProgress;
    const pp = phaseProgress(0, gp);
    modelRef.current!.scale.setScalar(THREE.MathUtils.lerp(0.98, 1.02, pp));
    spinY.current += delta * 0.25;
    modelRef.current!.rotation.y = spinY.current;
  });

  return (
    <group ref={wrapperRef} position={[-1, 0, 0]} visible={false}>
      <group ref={modelRef} position={[6, 4, 0]}>
        <primitive object={scene} />
      </group>
      <InfoHotspot position={[2, 1.5, 0]} title="Sri Atragada" phaseIndex={0}>
        <div className="flex flex-col gap-4">
          <img src="/images/sri.jpg" alt="Sri Atragada" className="w-full h-40 object-cover rounded-lg border border-white/10" />
          <p>I am a Computer Science student at Stony Brook University with a minor in Finance. I build full-stack applications, scalable backend systems, and AI-driven platforms.</p>
        </div>
      </InfoHotspot>
    </group>
  );
}

// ── Phase 1: Battle Bus ──────────────────────────────────────────────────────
function BattleBusModel() {
  const { scene } = useGLTF('/models/battle-bus.glb', true);
  const wrapperRef = useRef<THREE.Group>(null);
  const modelRef = useRef<THREE.Group>(null);
  const dropTimer = useRef(0);
  const hoverOffset = useRef('Bus'.length * 0.731);
  const cachedMats = useRef<THREE.Material[]>([]);

  useEffect(() => {
    const box = new THREE.Box3().setFromObject(scene);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const scale = 6 / size.y;
    scene.scale.setScalar(scale);
    scene.position.set(-center.x * scale, -box.min.y * scale, -center.z * scale);

    const mats: THREE.Material[] = [];
    const emissiveColor = new THREE.Color('#1a1000');

    scene.traverse((child) => {
      if (!(child as THREE.Mesh).isMesh) return;
      const mesh = child as THREE.Mesh;
      const ms = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      for (const m of ms as THREE.MeshStandardMaterial[]) {
        m.transparent = true;
        m.depthWrite = true;
        if (m.emissive !== undefined) {
          m.emissive.copy(emissiveColor);
          m.emissiveIntensity = 0.08;
        }
        m.needsUpdate = true;
        mats.push(m);
      }
    });
    cachedMats.current = mats;
  }, [scene]);

  useFade(wrapperRef, 1, cachedMats, true);

  useFrame((_, delta) => {
    if (!wrapperRef.current?.visible) {
      dropTimer.current = 0;
      return;
    }
    const gp = scrollStore.globalProgress;
    const pp = phaseProgress(1, gp);
    modelRef.current!.scale.setScalar(THREE.MathUtils.lerp(0.98, 1.02, pp));

    dropTimer.current = Math.min(dropTimer.current + delta, 1.4);
    const dropT = easeOutCubic(dropTimer.current / 1.4);
    const dropY = THREE.MathUtils.lerp(20, 0, dropT);
    hoverOffset.current += delta * 0.8;
    modelRef.current!.position.y = dropY + Math.sin(hoverOffset.current) * 0.35;
  });

  return (
    <group ref={wrapperRef} position={[0, 0, 0]} visible={false}>
      <group ref={modelRef}>
        <primitive object={scene} />
      </group>
      <InfoHotspot position={[3.5, 3, 0]} title="WHO I AM" phaseIndex={1} htmlScale={0.35}>
        <div className="flex flex-col gap-4">
          <p>I am a Computer Science student who believes that technical skill is most effective when it is paired with a genuine sense of curiosity and a lighthearted perspective. While I spend a lot of time navigating the logic of systems and security, I make it a priority to bring a high-energy, approachable attitude to every project I take on. I value being the kind of person who is as easy to brainstorm with during a deadline as I am to talk to when the work is done. I find that keeping a sense of humor and staying open to new ideas helps me stay adaptable, allowing me to solve problems without losing sight of the people behind the technology. For me, the goal is to build things that are secure and functional, while remaining the kind of teammate who keeps the process engaging and collaborative.</p>
        </div>
      </InfoHotspot>
    </group>
  );
}

// ── Phase 2: Race Track ──────────────────────────────────────────────────────
function RaceTrackModel() {
  const { scene } = useGLTF('/models/drift_race_track_free.glb', false);
  const wrapperRef = useRef<THREE.Group>(null);
  const modelRef = useRef<THREE.Group>(null);
  const cachedMats = useRef<THREE.Material[]>([]);

  useEffect(() => {
    const box = new THREE.Box3().setFromObject(scene);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const scale = 12 / size.y;
    scene.scale.setScalar(scale);
    scene.position.set(-center.x * scale, -box.min.y * scale, -center.z * scale);

    const mats: THREE.Material[] = [];
    const emissiveColor = new THREE.Color('#0a0500');

    scene.traverse((child) => {
      if (!(child as THREE.Mesh).isMesh) return;
      const mesh = child as THREE.Mesh;
      const ms = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      for (const m of ms as THREE.MeshStandardMaterial[]) {
        m.transparent = true;
        m.depthWrite = true;
        if (m.emissive !== undefined) {
          m.emissive.copy(emissiveColor);
          m.emissiveIntensity = 0.06;
        }
        m.needsUpdate = true;
        mats.push(m);
      }
    });
    cachedMats.current = mats;
  }, [scene]);

  useFade(wrapperRef, 2, cachedMats, true);

  useFrame(() => {
    if (!wrapperRef.current?.visible) return;
    const gp = scrollStore.globalProgress;
    const pp = phaseProgress(2, gp);
    modelRef.current!.scale.setScalar(THREE.MathUtils.lerp(0.98, 1.02, pp));
  });

  return (
    <group ref={wrapperRef} position={[0, 0, 0]} visible={false}>
      <group ref={modelRef}>
        <primitive object={scene} />
      </group>

      {/* SBU Experience */}
      <InfoHotspot position={[-8, 2, 5]} title="SBU Intern" phaseIndex={2} htmlScale={1.5}>
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-6">
            <img src="/images/sbu.png" alt="SBU" className="w-24 h-24 rounded-[1.5rem] bg-white p-2" />
            <div>
              <p className="font-bold text-white">Stony Brook University</p>
              <p className="text-xl opacity-70">Software Engineer Intern</p>
            </div>
          </div>
          <p className="text-xl">Sep 2025 – Feb 2026</p>
          <p className="text-xl opacity-80">Designed and shipped a Python NLP service that converts natural-language library queries into Boolean search expressions.</p>
        </div>
      </InfoHotspot>

      {/* WEX Experience */}
      <InfoHotspot position={[8, 2, 5]} title="WEX Engineer" phaseIndex={2} htmlScale={1.5}>
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-6">
            <img src="/images/wex.png" alt="WEX" className="w-24 h-24 rounded-[1.5rem] bg-white p-2" />
            <div>
              <p className="font-bold text-white">WEX</p>
              <p className="text-xl opacity-70">Incoming Security Engineer</p>
            </div>
          </div>
          <p className="text-xl">May 2026</p>
          <p className="text-xl opacity-80">Incoming Security Engineer driving impact across application security and DevSecOps.</p>
        </div>
      </InfoHotspot>

      {/* Atlas Legacy */}
      <InfoHotspot position={[-5, 3, -12]} title="Atlas Legacy" phaseIndex={2} htmlScale={1.5}>
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-[1.5rem] bg-blue-600 flex items-center justify-center font-bold text-4xl">A</div>
            <div>
              <p className="font-bold text-white">Atlas Legacy Inc.</p>
              <p className="text-xl opacity-70">Software Engineer Intern</p>
            </div>
          </div>
          <p className="text-xl">May 2025 – Aug 2025</p>
          <p className="text-xl opacity-80">Built containerized AWS ECS deployment with GitHub Actions CI/CD pipelines, cutting release cycle time by 40%.</p>
        </div>
      </InfoHotspot>

      {/* Future Endeavors */}
      <InfoHotspot position={[5, 3, -12]} title="Future Endeavors" phaseIndex={2} htmlScale={1.5}>
        <div className="flex flex-col gap-4">
          <p className="text-2xl opacity-90 leading-relaxed">I am eager to tackle new technical challenges while continuing to grow as a collaborative and reliable teammate. My goal is to build secure, effective technology while maintaining the curiosity and positive energy that keeps the work engaging for everyone involved.</p>
        </div>
      </InfoHotspot>
    </group>
  );
}

// ── Phase 6: Hangar ──────────────────────────────────────────────────────────
function HangarModel() {
  const { scene } = useGLTF('/models/star-destroyer-hangar.glb', true);
  const wrapperRef = useRef<THREE.Group>(null);
  const modelRef = useRef<THREE.Group>(null);
  const cachedMats = useRef<THREE.Material[]>([]);

  useEffect(() => {
    const box = new THREE.Box3().setFromObject(scene);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const scale = 22 / size.y;

    scene.scale.setScalar(scale);
    scene.position.set(-center.x * scale, -center.y * scale, -center.z * scale);

    const mats: THREE.Material[] = [];

    scene.traverse((child) => {
      if (!(child as THREE.Mesh).isMesh) return;
      const mesh = child as THREE.Mesh;
      const ms = Array.isArray(mesh.material) ? mesh.material : [mesh.material];

      const newMats: THREE.MeshBasicMaterial[] = [];
      for (const m of ms) {
        const anyMat = m as any;
        const tex: THREE.Texture | null =
          anyMat.map ?? anyMat.emissiveMap ?? anyMat.lightMap ?? anyMat.aoMap ?? null;

        const basicMat = new THREE.MeshBasicMaterial({
          map: tex,
          side: anyMat.side ?? THREE.FrontSide,
          transparent: true,
          opacity: 1,
          depthWrite: false,  // restored by useFade when fully opaque
        });

        newMats.push(basicMat);
        mats.push(basicMat);
      }
      mesh.material = newMats.length === 1 ? newMats[0] : newMats;
    });

    cachedMats.current = mats;
  }, [scene]);

  useFade(wrapperRef, 6, cachedMats, true);

  useFrame(() => {
    if (!wrapperRef.current?.visible) return;
    const gp = scrollStore.globalProgress;
    const pp = phaseProgress(6, gp);
    modelRef.current!.scale.setScalar(THREE.MathUtils.lerp(0.98, 1.02, pp));
  });

  return (
    <group ref={wrapperRef} position={[3000, 0, 0]} visible={false}>
      <group ref={modelRef}>
        <primitive object={scene} />
      </group>
      <InfoHotspot position={[3, 3.5, -6]} title="CONTACT?" phaseIndex={6} htmlScale={0.5}>
        <div className="flex flex-col gap-6">
          <p className="text-2xl">This is where the journey ends… and the next one begins. Reach out to me anytime.</p>
          <p className="font-bold text-2xl">Email: sridharatragada@gmail.com</p>
          <p className="font-bold text-2xl">Phone: (207) 303-5293</p>
        </div>
      </InfoHotspot>
    </group>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
//  SKYBOX SPHERES — phases 3, 4, 5
// ═════════════════════════════════════════════════════════════════════════════

function SkyboxSphere({
  texturePath,
  phaseIndex,
  position,
  children
}: {
  texturePath: string;
  phaseIndex: number;
  position: [number, number, number];
  children?: React.ReactNode;
}) {
  const texture = useLoader(THREE.TextureLoader, texturePath);

  useEffect(() => {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.flipY = false;
    texture.needsUpdate = true;
  }, [texture]);

  const geometry = useMemo(
    () => new THREE.SphereGeometry(500, 60, 40),
    [],
  );

  const matRef = useRef<THREE.MeshBasicMaterial>(null);
  const groupRef = useRef<THREE.Group>(null);
  const cachedMats = useRef<THREE.Material[]>([]);

  useEffect(() => {
    if (matRef.current) {
      cachedMats.current = [matRef.current];
    }
  }, []);

  useFade(groupRef, phaseIndex, cachedMats, false);

  return (
    <group ref={groupRef} position={position} visible={false}>
      <mesh geometry={geometry} scale={[-1, 1, 1]} renderOrder={-10}>
        <meshBasicMaterial
          ref={matRef}
          map={texture}
          side={THREE.BackSide}
          transparent
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
      {children}
    </group>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
//  MAIN EXPORT
// ═════════════════════════════════════════════════════════════════════════════

export default function CharacterStage() {
  return (
    <>
      <SpiderManModel />
      <BattleBusModel />
      <RaceTrackModel />
      <HangarModel />

      <SkyboxSphere
        phaseIndex={3}
        texturePath="/textures/jungle_panorama.jpg"
        position={[0, 0, 0]}
      >
        {/* Phase 3 - Projects */}
        <InfoHotspot position={[4, 0, 4]} title="CHRONICLE RPG" phaseIndex={3} htmlScale={0.35}>
          <div className="flex flex-col gap-4">
            <p className="text-xl opacity-70 text-blue-300 font-bold tracking-wider">React, Python, Zustand, ChromaDB</p>
            <p className="text-xl opacity-80 mt-1 leading-relaxed">Architected a fully playable 10,000 × 10,000 tile open-world RPG engine where the player navigates a living world of hundreds of autonomous agents.</p>
            <a href="https://github.com/sriaratragada/Chronicle-Game" target="_blank" rel="noopener noreferrer" className="mt-2 text-xl text-[#e62429] hover:text-white flex items-center gap-2 font-bold transition-colors">VIEW REPOSITORY ➔</a>
          </div>
        </InfoHotspot>

        <InfoHotspot position={[4, 0, 0]} title="FORMFLOW AI" phaseIndex={3} htmlScale={0.35}>
          <div className="flex flex-col gap-4">
            <p className="text-xl opacity-70 text-green-300 font-bold tracking-wider">JavaScript, MediaPipe, Socket.IO, MongoDB</p>
            <p className="text-xl opacity-80 mt-1 leading-relaxed">Built a real-time AI fitness platform that scores workout form rep-by-rep via webcam. Won 2nd Place at Code-A-Site Hackathon.</p>
            <a href="https://github.com/FormFlow26/CodeASite26Project/" target="_blank" rel="noopener noreferrer" className="mt-2 text-xl text-[#e62429] hover:text-white flex items-center gap-2 font-bold transition-colors">VIEW REPOSITORY ➔</a>
          </div>
        </InfoHotspot>

        <InfoHotspot position={[4, 0, -4]} title="HF ORDER MATCHING" phaseIndex={3} htmlScale={0.35}>
          <div className="flex flex-col gap-4">
            <p className="text-xl opacity-70 text-red-300 font-bold tracking-wider">C++, CMake, GoogleTest</p>
            <p className="text-xl opacity-80 mt-1 leading-relaxed">Engineered a low-latency matching engine in C++ implementing a Price-Time Priority (FIFO) algorithm and a Pro-Rata allocation model utilizing a largest-remainder split to execute limit and market orders with deterministic sub-microsecond performance.</p>
            <a href="https://github.com/sriaratragada/HighFrequencyOrderMatching" target="_blank" rel="noopener noreferrer" className="mt-2 text-xl text-[#e62429] hover:text-white flex items-center gap-2 font-bold transition-colors">VIEW REPOSITORY ➔</a>
          </div>
        </InfoHotspot>
      </SkyboxSphere>

      <SkyboxSphere
        phaseIndex={4}
        texturePath="/textures/clouds_panorama.jpg"
        position={[1000, 0, 0]}
      >
        <InfoHotspot position={[0, 0, 5]} title="ABOVE THE CLOUDS" phaseIndex={4}>
          <div className="flex flex-col gap-2">
            <p>Breaking through the cloud line, snowy peaks stretch to the horizon in every direction.</p>
          </div>
        </InfoHotspot>
      </SkyboxSphere>

      <SkyboxSphere
        phaseIndex={5}
        texturePath="/textures/forest_panorama.jpg"
        position={[2000, 0, 0]}
      >
        <FireflyGame phaseIndex={5} />
      </SkyboxSphere>
    </>
  );
}

useGLTF.preload('/models/spider-man_symbiote.glb', false);
useGLTF.preload('/models/battle-bus.glb', true);
useGLTF.preload('/models/star-destroyer-hangar.glb', true);
