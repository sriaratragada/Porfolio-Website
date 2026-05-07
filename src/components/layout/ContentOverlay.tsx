'use client';

// ── Content Overlay ────────────────────────────────────────────────────────────
// Fixed-position HTML layer that sits over the 3D canvas.
// Seven phases — each has 3D CSS text (CSS perspective + translateZ).
// Transition flash: black overlay peaks at each phase boundary.
// All text uses GSAP ScrollTrigger driven by the scroll container.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { motion } from 'framer-motion';
import { Sparkles, Code, Cpu, Layers, Mountain, Rocket } from 'lucide-react';
import { scrollStore, PHASES, TRANSITIONS } from '@/lib/scrollStore';

gsap.registerPlugin(ScrollTrigger);

// Convert 0-1 phase bounds to 0-100 percentages for ScrollTrigger
const pct = (v: number) => v * 100;

const P = 900; // CSS perspective in px — shared vanishing point feel

// ── Phase text panel with depth-layer animation ────────────────────────────
interface PanelProps {
  scrollEl: HTMLElement | null;
  phaseStart: number; // 0-100
  phaseEnd: number;
  label: string;
  title: string;
  children: ReactNode;
  align?: 'left' | 'right';
  icon?: ReactNode;
}

function PhasePanel({ scrollEl, phaseStart, phaseEnd, label, title, children, align = 'left', icon }: PanelProps) {
  const wrapRef  = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLParagraphElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const bodyRef  = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!scrollEl || !wrapRef.current) return;

    const FADE = (phaseEnd - phaseStart) * 0.18; // 18% of phase = fade zone

    const enterStart  = phaseStart;
    const enterEnd    = phaseStart + FADE;
    const activeStart = enterEnd;
    const activeEnd   = phaseEnd - FADE;
    const exitStart   = activeEnd;
    const exitEnd     = phaseEnd;

    const els = [labelRef.current, titleRef.current, bodyRef.current];

    // Initial state: invisible, far behind
    gsap.set(els, { transformPerspective: P, z: -300, opacity: 0, overwrite: true });

    // ENTER: fly in from behind (z=-300 → 0), staggered per element
    const st1 = ScrollTrigger.create({
      trigger: scrollEl,
      start: `${enterStart}% top`,
      end:   `${enterEnd}% top`,
      scrub: 0.8,
      onUpdate: (self) => {
        const p = self.progress;
        gsap.set(labelRef.current, { transformPerspective: P, z: -300 + p * 300, opacity: p });
        gsap.set(titleRef.current, { transformPerspective: P, z: -300 + p * 300, opacity: p });
        gsap.set(bodyRef.current,  { transformPerspective: P, z: -300 + p * 300, opacity: p });
      },
    });

    // ACTIVE: depth layers separate as user scrolls through the phase
    const st2 = ScrollTrigger.create({
      trigger: scrollEl,
      start: `${activeStart}% top`,
      end:   `${activeEnd}% top`,
      scrub: 1,
      onUpdate: (self) => {
        const p = self.progress;
        gsap.set(labelRef.current, { transformPerspective: P, z: p * 24  });
        gsap.set(titleRef.current, { transformPerspective: P, z: p * 70  });
        gsap.set(bodyRef.current,  { transformPerspective: P, z: p * 38  });
      },
    });

    // EXIT: zoom towards camera (z → +120) and fade out
    const st3 = ScrollTrigger.create({
      trigger: scrollEl,
      start: `${exitStart}% top`,
      end:   `${exitEnd}% top`,
      scrub: 0.8,
      onUpdate: (self) => {
        const p = self.progress;
        gsap.set(labelRef.current, { transformPerspective: P, z: 24  + p * 120, opacity: 1 - p });
        gsap.set(titleRef.current, { transformPerspective: P, z: 70  + p * 120, opacity: 1 - p });
        gsap.set(bodyRef.current,  { transformPerspective: P, z: 38  + p * 120, opacity: 1 - p });
      },
    });

    return () => { st1.kill(); st2.kill(); st3.kill(); };
  }, [scrollEl, phaseStart, phaseEnd]);

  const side = align === 'left'
    ? { left: '5vw' }
    : { right: '5vw' };

  return (
    <div
      ref={wrapRef}
      style={{
        position: 'fixed',
        ...side,
        top: '50%',
        transform: 'translateY(-50%)',
        width: 'clamp(280px, 38vw, 520px)',
        pointerEvents: 'none',
        zIndex: 20,
      }}
    >
      <div
        ref={labelRef}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '12px',
          opacity: 0,
          color: 'var(--noir-cyan)',
        }}
      >
        {icon && <div className="text-cyan-400">{icon}</div>}
        <p
          style={{
            fontFamily: 'var(--font-space-grotesk)',
            fontSize: '12px',
            fontWeight: 600,
            letterSpacing: '0.25em',
            margin: 0,
          }}
        >
          {label}
        </p>
      </div>

      <h2
        ref={titleRef}
        className="text-gradient-cyan"
        style={{
          fontFamily: 'var(--font-space-grotesk)',
          fontWeight: 700,
          fontSize: 'clamp(42px, 5vw, 64px)',
          lineHeight: 0.95,
          margin: 0,
          letterSpacing: '-0.02em',
          opacity: 0,
        }}
      >
        {title}
      </h2>

      <div
        ref={bodyRef}
        className="glass-panel"
        style={{ marginTop: '24px', padding: '24px', color: 'rgba(255,255,255,0.85)', fontSize: '15px', lineHeight: 1.7, opacity: 0 }}
      >
        {children}
      </div>
    </div>
  );
}

// ── Hero name panel (Phase 0 — Manhattan) ─────────────────────────────────
function HeroPanel({ scrollEl }: { scrollEl: HTMLElement | null }) {
  const hudRef   = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLParagraphElement>(null);
  const nameRef  = useRef<HTMLHeadingElement>(null);
  const roleRef  = useRef<HTMLParagraphElement>(null);
  const ctaRef   = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!scrollEl || !hudRef.current) return;

    // Entrance animation
    gsap.from(labelRef.current, { transformPerspective: P, z: -200, opacity: 0, duration: 1.0, delay: 0.3, ease: 'power3.out' });
    gsap.from(nameRef.current,  { transformPerspective: P, z: -200, opacity: 0, duration: 1.1, delay: 0.45, ease: 'power3.out' });
    gsap.from(roleRef.current,  { transformPerspective: P, z: -200, opacity: 0, duration: 1.0, delay: 0.6,  ease: 'power3.out' });
    gsap.from(ctaRef.current,   { transformPerspective: P, z: -200, opacity: 0, duration: 0.9, delay: 0.75, ease: 'power3.out' });

    // Scroll exit: depth layers + fade
    const PHASE_END = 14;
    const EXIT_START = 9;

    const stActive = ScrollTrigger.create({
      trigger: scrollEl,
      start: '0% top',
      end:   `${EXIT_START}% top`,
      scrub: 1,
      onUpdate: (self) => {
        const p = self.progress;
        gsap.set(labelRef.current, { transformPerspective: P, z: p * 20 });
        gsap.set(nameRef.current,  { transformPerspective: P, z: p * 65 });
        gsap.set(roleRef.current,  { transformPerspective: P, z: p * 35 });
        gsap.set(ctaRef.current,   { transformPerspective: P, z: p * 18 });
      },
    });

    const stExit = ScrollTrigger.create({
      trigger: scrollEl,
      start: `${EXIT_START}% top`,
      end:   `${PHASE_END}% top`,
      scrub: 0.8,
      onUpdate: (self) => {
        const p = self.progress;
        gsap.set(hudRef.current, { opacity: 1 - p });
      },
    });

    return () => { stActive.kill(); stExit.kill(); };
  }, [scrollEl]);

  return (
    <div
      ref={hudRef}
      style={{
        position: 'fixed',
        bottom: '72px',
        left: '48px',
        pointerEvents: 'none',
        zIndex: 20,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
        <Sparkles size={14} className="text-rose-400" />
        <p ref={labelRef} style={{ fontFamily: 'var(--font-space-grotesk)', fontSize: '12px', fontWeight: 600, letterSpacing: '0.25em', color: 'var(--noir-silver)', margin: 0 }}>
          PORTFOLIO — 2026
        </p>
      </div>

      <div style={{ fontSize: 'clamp(52px, 8vw, 96px)', lineHeight: 0.95 }}>
        <h1
          ref={nameRef}
          className="text-gradient-rose"
          style={{ fontSize: 'inherit', lineHeight: 'inherit', fontFamily: 'var(--font-space-grotesk)', fontWeight: 700, margin: 0, letterSpacing: '-0.02em' }}
        >
          YOUR<br />NAME
        </h1>
      </div>

      <p ref={roleRef} style={{ fontFamily: 'var(--font-space-grotesk)', fontWeight: 500, fontSize: '15px', color: 'var(--noir-cyan)', letterSpacing: '0.05em', marginTop: '24px' }}>
        Developer<span className="sep" style={{ color: 'var(--spider-red)', margin: '0 8px' }}>/</span>Creator<span className="sep" style={{ color: 'var(--spider-red)', margin: '0 8px' }}>/</span>Engineer
      </p>

      <div
        ref={ctaRef}
        style={{ marginTop: '32px', pointerEvents: 'auto' }}
      >
        <button
          className="group relative overflow-hidden rounded-full border border-white/20 bg-white/5 px-8 py-3 text-sm font-semibold tracking-widest text-white backdrop-blur-md transition-all hover:border-white/40 hover:bg-white/10"
          style={{ fontFamily: 'var(--font-space-grotesk)' }}
        >
          <span className="relative z-10 flex items-center gap-2">
            EXPLORE THE UNIVERSE
          </span>
          <span className="absolute inset-0 z-0 scale-x-0 rounded-full bg-gradient-to-r from-rose-500 to-orange-500 opacity-20 transition-transform duration-500 group-hover:scale-x-100" />
        </button>
      </div>
    </div>
  );
}

// ── Phase transition flash overlay ────────────────────────────────────────
// Peaks black at each phase boundary.
function TransitionFlash({ scrollEl }: { scrollEl: HTMLElement | null }) {
  const flashRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!scrollEl || !flashRef.current) return;

    // Phase boundaries derived from scrollStore PHASES — single source of truth
    const transitions = TRANSITIONS.map(t => t * 100);
    const HALF_WIDTH  = 3; // ±3% around boundary = 6% total flash window

    const triggers = transitions.map((center) =>
      ScrollTrigger.create({
        trigger: scrollEl,
        start: `${center - HALF_WIDTH}% top`,
        end:   `${center + HALF_WIDTH}% top`,
        scrub: true,
        onUpdate: (self) => {
          // Triangle wave: 0 → 1 → 0 as progress goes 0 → 0.5 → 1
          const p = self.progress;
          const opacity = p < 0.5 ? p * 2 : (1 - p) * 2;
          if (flashRef.current) flashRef.current.style.opacity = String(opacity * 0.92);
        },
      })
    );

    return () => triggers.forEach((t) => t.kill());
  }, [scrollEl]);

  return (
    <div
      ref={flashRef}
      style={{
        position: 'fixed',
        inset: 0,
        background: '#000',
        opacity: 0,
        zIndex: 50,
        pointerEvents: 'none',
      }}
    />
  );
}

// ── Scroll indicator (Phase 0 only) ──────────────────────────────────────
function ScrollIndicator({ scrollEl }: { scrollEl: HTMLElement | null }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!scrollEl || !ref.current) return;
    gsap.from(ref.current, { opacity: 0, duration: 0.6, delay: 1.4 });
    const st = ScrollTrigger.create({
      trigger: scrollEl,
      start: '5% top',
      end:   '18% top',
      scrub: 0.6,
      onUpdate: (self) => {
        if (ref.current) ref.current.style.opacity = String(1 - self.progress);
      },
    });
    return () => st.kill();
  }, [scrollEl]);

  return (
    <div
      ref={ref}
      style={{ position: 'fixed', bottom: '72px', right: '48px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', pointerEvents: 'none', zIndex: 20 }}
    >
      <span style={{ fontFamily: 'var(--font-bebas)', fontSize: '10px', letterSpacing: '0.3em', color: 'rgba(240,240,240,0.25)', writingMode: 'vertical-rl' }}>
        SCROLL
      </span>
      <div style={{ width: '1px', height: '40px', background: 'linear-gradient(to bottom, rgba(230,36,41,0.6), transparent)', animation: 'pulse 2s ease-in-out infinite' }} />
    </div>
  );
}

// ── Phase progress dots ──────────────────────────────────────────────────
function PhaseDots({ scrollEl }: { scrollEl: HTMLElement | null }) {
  const dotRefs = useRef<Array<HTMLDivElement | null>>([]);

  useEffect(() => {
    if (!scrollEl) return;
    const CENTERS = [7, 21, 35, 49, 63, 77, 92]; // midpoints of each phase

    const triggers = CENTERS.map((center, i) => {
      const dot = dotRefs.current[i];
      if (!dot) return null;

      return ScrollTrigger.create({
        trigger: scrollEl,
        start: `${center - 10}% top`,
        end:   `${center + 10}% top`,
        scrub: 0.5,
        onUpdate: (self) => {
          if (dot) {
            dot.style.background = self.progress > 0 && self.progress < 1 ? '#e62429' : 'rgba(255,255,255,0.3)';
          }
        },
      });
    });

    return () => triggers.forEach((t) => t?.kill());
  }, [scrollEl]);

  return (
    <div style={{ position: 'fixed', right: '24px', top: '50%', transform: 'translateY(-50%)', display: 'flex', flexDirection: 'column', gap: '10px', zIndex: 20, pointerEvents: 'none' }}>
      {Array.from({ length: 7 }, (_, i) => (
        <div
          key={i}
          ref={(node) => {
            dotRefs.current[i] = node;
          }}
          style={{ width: '6px', height: '6px', borderRadius: '50%', background: i === 0 ? '#e62429' : 'rgba(255,255,255,0.3)', transition: 'background 0.3s' }}
        />
      ))}
    </div>
  );
}

// ── Drag Indicator (Phases 3, 4, 5) ───────────────────────────────────────
function DragIndicator() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const check = (gp: number) => {
      const active = gp >= PHASES[3].start && gp < PHASES[6].start;
      setVisible(active);
    };
    const unsub = scrollStore.subscribe(check);
    check(scrollStore.globalProgress);
    return unsub;
  }, []);

  if (!visible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '40px',
        left: '50%',
        transform: 'translateX(-50%)',
        pointerEvents: 'none',
        zIndex: 100,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px',
      }}
      className="animate-pulse"
    >
      <div style={{
        width: '24px',
        height: '24px',
        border: '2px solid rgba(255,255,255,0.8)',
        borderRadius: '50%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}>
        <div style={{ width: '4px', height: '4px', background: 'rgba(255,255,255,0.8)', borderRadius: '50%' }} />
      </div>
      <span style={{
        fontFamily: 'var(--font-bebas)',
        letterSpacing: '0.1em',
        fontSize: '14px',
        color: 'rgba(255,255,255,0.8)',
      }}>
        DRAG TO EXPLORE
      </span>
    </div>
  );
}

// ── Main export ──────────────────────────────────────────────────────────────
export default function ContentOverlay({ scrollEl }: { scrollEl: HTMLElement | null }) {
  return (
    <>
      {/* Cinematic letterbox bars */}
      <div className="letterbox-bar letterbox-top" style={{ zIndex: 25 }} />
      <div className="letterbox-bar letterbox-bottom" style={{ zIndex: 25 }} />

      <ScrollIndicator scrollEl={scrollEl} />
      {/* Phase progress dots */}
      <PhaseDots scrollEl={scrollEl} />

      {/* Black flash at every phase transition */}
      <TransitionFlash scrollEl={scrollEl} />

      {/* Blinking Drag Indicator for photo spheres */}
      <DragIndicator />
    </>
  );
}
