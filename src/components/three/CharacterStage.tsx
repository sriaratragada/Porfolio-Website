'use client';

// ── Character Stage (v3) ──────────────────────────────────────────────────────
// Added InfoHotspot for interactive 3D UX.
// ─────────────────────────────────────────────────────────────────────────────

import { useRef, useEffect, useMemo, useState } from 'react';
import { useFrame, useLoader, useThree } from '@react-three/fiber';
import { useGLTF, Html, Float } from '@react-three/drei';
import * as THREE from 'three';
import { scrollStore, PHASES, phaseOpacity, phaseProgress } from '@/lib/scrollStore';
import { FireflyGame } from './FireflyGame';

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function computePhaseActiveOpacity(phaseIndex: number, gp: number): number {
  const phase = PHASES[phaseIndex];
  return gp > phase.start && gp < phase.end ? 1 : 0;
}

function computeHotspotOpacity(phaseIndex: number, gp: number, offsetFraction?: number, instantVisibility?: boolean): number {
  if (instantVisibility) return computePhaseActiveOpacity(phaseIndex, gp);
  if (!offsetFraction) return phaseOpacity(phaseIndex, gp, 0.02);
  const pp = phaseProgress(phaseIndex, gp);
  if (pp < offsetFraction) return 0;
  const fadeSize = 0.04;
  const fadeIn = (pp - offsetFraction) / fadeSize;
  const fadeOut = (1 - pp) / fadeSize;
  const t = Math.min(1, Math.min(fadeIn, fadeOut));
  return t * t * (3 - 2 * t);
}

function InfoHotspot({ position, title, children, rotation, phaseIndex, htmlScale = 1, triggerScale = 1, cardScale = 1, cardWidth, phaseOffsetFraction, instantVisibility = false }: { position: [number, number, number], title: string, children: React.ReactNode, rotation?: [number, number, number], phaseIndex: number, htmlScale?: number, triggerScale?: number, cardScale?: number, cardWidth?: string, phaseOffsetFraction?: number, instantVisibility?: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  // Track opacity in state so we can fully unmount the Html component when it's totally hidden
  const [opacity, setOpacity] = useState(0);
  // Compute mobile-safe card width once on mount
  const effectiveCardWidth = cardWidth ?? (typeof window !== 'undefined' && window.innerWidth < 768 ? `${Math.min(300, window.innerWidth - 32)}px` : '380px');

  useFrame(() => {
    const gp = scrollStore.globalProgress;
    const newOpacity = computeHotspotOpacity(phaseIndex, gp, phaseOffsetFraction, instantVisibility);

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
          <Html center transform sprite zIndexRange={[100, 0]} scale={htmlScale * triggerScale}>
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
          <Html center transform sprite position={[0, 0, 0]} style={{ transition: 'all 0.3s' }} zIndexRange={[100, 0]} scale={htmlScale * cardScale}>
            <div
              ref={cardRef}
              className="flex flex-col text-white"
              style={{
                width: effectiveCardWidth,
                fontFamily: 'var(--font-space-grotesk)',
                background: 'rgba(6, 7, 14, 0.82)',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                borderRadius: '24px',
                border: '1px solid rgba(255,255,255,0.13)',
                boxShadow: '0 20px 60px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.08)',
                padding: '28px 32px 30px',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', paddingBottom: '14px', borderBottom: '1px solid rgba(255,255,255,0.09)' }}>
                <p style={{ fontSize: '14px', fontWeight: 700, letterSpacing: '0.26em', color: 'var(--noir-cyan)', textTransform: 'uppercase', margin: 0 }}>{title}</p>
                <button
                  onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}
                  style={{ fontSize: '18px', lineHeight: 1, background: 'none', border: 'none', padding: '4px 8px', color: 'rgba(255,255,255,0.28)', cursor: 'pointer' }}
                >✕</button>
              </div>
              <div style={{ fontSize: '20px', fontWeight: 300, lineHeight: 1.8, color: 'rgba(255,255,255,0.82)' }}>
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
  instantVisibility = false,
) {
  const lastOpacity = useRef(-1);
  const wasVisible = useRef(false);

  useFrame(() => {
    if (!groupRef.current) return;
    const gp = scrollStore.globalProgress;
    const opacity = instantVisibility
      ? computePhaseActiveOpacity(phaseIndex, gp)
      : phaseOpacity(phaseIndex, gp, 0.06);

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
  const { viewport } = useThree();
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

  useFrame((state, delta) => {
    if (!wrapperRef.current?.visible) return;
    
    // Dynamic top-right anchoring based on viewport
    if (modelRef.current) {
      const margin = 1.5;
      const targetX = viewport.width / 2 - margin;
      const targetY = viewport.height / 2 - margin;
      
      // Gentle hover and spin
      modelRef.current.position.x = THREE.MathUtils.lerp(modelRef.current.position.x, targetX, 0.1);
      modelRef.current.position.y = THREE.MathUtils.lerp(modelRef.current.position.y, targetY + Math.sin(state.clock.elapsedTime) * 0.2, 0.1);
      
      spinY.current += delta * 0.25;
      modelRef.current.rotation.y = spinY.current;
    }
  });

  return (
    <group ref={wrapperRef} position={[0, 0, 0]} visible={false}>
      <group ref={modelRef}>
        <primitive object={scene} />
      </group>
      <InfoHotspot position={[0, 1.5, 0]} title="Sri Atragada" phaseIndex={0} htmlScale={1.25} cardWidth="220px">
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

  useFade(wrapperRef, 1, cachedMats, true, true);

  useFrame(() => {
    if (!wrapperRef.current?.visible) {
      return;
    }
    const gp = scrollStore.globalProgress;
    const pp = phaseProgress(1, gp);
    modelRef.current!.scale.setScalar(THREE.MathUtils.lerp(0.98, 1.02, pp));

    // Keep Phase 1 deterministic by deriving the bus motion entirely from scroll progress.
    const dropPhase = Math.min(pp / 0.35, 1);
    const dropT = easeOutCubic(dropPhase);
    const dropY = THREE.MathUtils.lerp(20, 0, dropT);
    const hoverY = Math.sin(pp * Math.PI * 3) * 0.35;
    modelRef.current!.position.y = dropY + hoverY;
  });

  return (
    <group ref={wrapperRef} position={[0, 0, 0]} visible={false}>
      <group ref={modelRef}>
        <primitive object={scene} />
      </group>
      <InfoHotspot position={[-400, 8, 4]} title="WHO I AM" phaseIndex={1} htmlScale={3.5} triggerScale={10} cardScale={7} instantVisibility cardWidth="700px">
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
      <InfoHotspot position={[-20, 2, 6]} title="SBU Intern" phaseIndex={2} htmlScale={1.75} cardWidth="420px">
        <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
          <img src="/images/sbu.png" alt="SBU" style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'white', padding: '6px', flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '3px' }}>
              <p style={{ fontWeight: 700, fontSize: '13px', color: '#fff' }}>Stony Brook University</p>
              <p style={{ fontSize: '11px', opacity: 0.45, flexShrink: 0, marginLeft: '8px' }}>Sep 2025 – Feb 2026</p>
            </div>
            <p style={{ fontSize: '11px', color: 'var(--noir-cyan)', marginBottom: '8px', opacity: 0.8 }}>Software Engineer Intern</p>
            <p style={{ fontSize: '12px', lineHeight: 1.55, opacity: 0.78 }}>Deployed a Python NLP service converting natural-language library queries into Boolean search expressions for 25K+ users. Reduced zero-result searches by 35% via Pinecone semantic search.</p>
          </div>
        </div>
      </InfoHotspot>

      {/* WEX Experience */}
      <InfoHotspot position={[20, 2, 6]} title="WEX Engineer" phaseIndex={2} htmlScale={1.3} cardWidth="420px">
        <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
          <img src="/images/wex.png" alt="WEX" style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'white', padding: '6px', flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '3px' }}>
              <p style={{ fontWeight: 700, fontSize: '13px', color: '#fff' }}>WEX Inc.</p>
              <p style={{ fontSize: '11px', opacity: 0.45, flexShrink: 0, marginLeft: '8px' }}>May 2026 →</p>
            </div>
            <p style={{ fontSize: '11px', color: 'var(--noir-cyan)', marginBottom: '8px', opacity: 0.8 }}>Incoming Security Engineer</p>
            <p style={{ fontSize: '12px', lineHeight: 1.55, opacity: 0.78 }}>Driving impact across application security and DevSecOps. Focused on securing cloud-native infrastructure and integrating security earlier into the development lifecycle.</p>
          </div>
        </div>
      </InfoHotspot>

      {/* Atlas Legacy */}
      <InfoHotspot position={[-16, 3, -25]} title="Atlas Legacy" phaseIndex={2} htmlScale={2.5} cardWidth="320px">
        <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '20px', flexShrink: 0 }}>A</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '3px' }}>
              <p style={{ fontWeight: 700, fontSize: '13px', color: '#fff' }}>Atlas Legacy Inc.</p>
              <p style={{ fontSize: '11px', opacity: 0.45, flexShrink: 0, marginLeft: '8px' }}>May – Aug 2025</p>
            </div>
            <p style={{ fontSize: '11px', color: 'var(--noir-cyan)', marginBottom: '8px', opacity: 0.8 }}>Software Engineer Intern</p>
            <p style={{ fontSize: '12px', lineHeight: 1.55, opacity: 0.78 }}>Built containerized AWS ECS deployment with GitHub Actions CI/CD, cutting release time by 40%. Optimized EC2 costs by 20% and shipped a demand forecasting pipeline saving 10 hrs/week.</p>
          </div>
        </div>
      </InfoHotspot>

      {/* Future Endeavors */}
      <InfoHotspot position={[16, 3, -20]} title="Future Endeavors" phaseIndex={2} htmlScale={2} cardWidth="300px">
        <p style={{ fontSize: '13px', lineHeight: 1.65, opacity: 0.85 }}>I'm eager to tackle new technical challenges while growing as a collaborative teammate. My goal is to build secure, effective technology — and bring the curiosity and energy that keeps the work engaging for everyone involved.</p>
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
      <InfoHotspot position={[3, 3.5, -6]} title="CONTACT?" phaseIndex={6} htmlScale={0.5} triggerScale={3}>
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
        <InfoHotspot position={[4, 0, 4]} title="CHRONICLE RPG" phaseIndex={3} htmlScale={0.42}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
              {['React', 'Python', 'Zustand', 'ChromaDB', 'RAG'].map(t => (
                <span key={t} style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '100px', background: 'rgba(96,165,250,0.15)', border: '1px solid rgba(96,165,250,0.3)', color: '#93c5fd' }}>{t}</span>
              ))}
            </div>
            <p style={{ fontSize: '12px', lineHeight: 1.6, opacity: 0.82 }}>Architected a fully playable 10,000 × 10,000 tile open-world RPG engine. Hundreds of autonomous NPC agents powered by RAG-based persistent memory.</p>
            <a href="https://github.com/sriaratragada/Chronicle-Game" target="_blank" rel="noopener noreferrer" style={{ fontSize: '11px', color: '#e62429', fontWeight: 700, letterSpacing: '0.1em', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>VIEW REPO ➔</a>
          </div>
        </InfoHotspot>
        <InfoHotspot position={[4, 0, 0]} title="FORMFLOW AI" phaseIndex={3} htmlScale={0.42}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
              {['JavaScript', 'MediaPipe', 'Socket.IO', 'MongoDB'].map(t => (
                <span key={t} style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '100px', background: 'rgba(52,211,153,0.15)', border: '1px solid rgba(52,211,153,0.3)', color: '#6ee7b7' }}>{t}</span>
              ))}
            </div>
            <p style={{ fontSize: '12px', lineHeight: 1.6, opacity: 0.82 }}>Real-time AI fitness platform scoring workout form rep-by-rep via webcam, with multiplayer leaderboards. <span style={{ color: '#fbbf24', fontWeight: 600 }}>🏆 2nd Place — Code-A-Site Hackathon</span></p>
            <a href="https://github.com/FormFlow26/CodeASite26Project/" target="_blank" rel="noopener noreferrer" style={{ fontSize: '11px', color: '#e62429', fontWeight: 700, letterSpacing: '0.1em', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>VIEW REPO ➔</a>
          </div>
        </InfoHotspot>

        <InfoHotspot position={[4, 0, -4]} title="HF ORDER MATCHING" phaseIndex={3} htmlScale={0.42}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
              {['C++', 'CMake', 'GoogleTest', 'Lock-free'].map(t => (
                <span key={t} style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '100px', background: 'rgba(248,113,113,0.15)', border: '1px solid rgba(248,113,113,0.3)', color: '#fca5a5' }}>{t}</span>
              ))}
            </div>
            <p style={{ fontSize: '12px', lineHeight: 1.6, opacity: 0.82 }}>Low-latency matching engine with Price-Time Priority (FIFO) and Pro-Rata allocation. Deterministic sub-microsecond order execution using lock-free data structures.</p>
            <a href="https://github.com/sriaratragada/HighFrequencyOrderMatching" target="_blank" rel="noopener noreferrer" style={{ fontSize: '11px', color: '#e62429', fontWeight: 700, letterSpacing: '0.1em', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>VIEW REPO ➔</a>
          </div>
        </InfoHotspot>
      </SkyboxSphere>

      <SkyboxSphere
        phaseIndex={4}
        texturePath="/textures/clouds_panorama.jpg"
        position={[1000, 0, 0]}
      >
        <InfoHotspot position={[5, 0,-1]} title="SKILLS" phaseIndex={4} htmlScale={0.4} cardWidth="400px" phaseOffsetFraction={0}>
          {(() => {
            const groups: { label: string; color: string; items: string[] }[] = [
              { label: 'LANGUAGES', color: '#00e5ff', items: ['Python', 'TypeScript', 'C++', 'Java', 'SQL', 'R'] },
              { label: 'FRAMEWORKS & AI', color: '#a78bfa', items: ['React', 'FastAPI', 'LangChain', 'Spring Boot', 'PyTorch'] },
              { label: 'CLOUD & INFRA', color: '#34d399', items: ['AWS ECS', 'Docker', 'GitHub Actions', 'Pinecone'] },
              { label: 'DATABASES', color: '#fb923c', items: ['PostgreSQL', 'MongoDB', 'Supabase', 'ChromaDB'] },
            ];
            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {groups.map(g => (
                  <div key={g.label}>
                    <p style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.2em', opacity: 0.45, marginBottom: '6px' }}>{g.label}</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                      {g.items.map(s => (
                        <span key={s} style={{ fontSize: '11px', padding: '3px 9px', borderRadius: '100px', background: `${g.color}18`, border: `1px solid ${g.color}35`, color: g.color, fontWeight: 500 }}>{s}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
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
