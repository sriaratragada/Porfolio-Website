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
import { scrollStore, PHASES, TRANSITIONS } from '@/lib/scrollStore';
import { useLenis } from '@/components/layout/LenisProvider';

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

function PhasePanel({ scrollEl, phaseStart, phaseEnd, label, title, align = 'left', icon }: Omit<PanelProps, 'children'> & { children?: ReactNode }) {
  const wrapRef  = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLParagraphElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (!scrollEl || !wrapRef.current) return;

    const FADE = (phaseEnd - phaseStart) * 0.18;

    const enterStart  = phaseStart;
    const enterEnd    = phaseStart + FADE;
    const activeStart = enterEnd;
    const activeEnd   = phaseEnd - FADE;
    const exitStart   = activeEnd;
    const exitEnd     = phaseEnd;

    gsap.set([labelRef.current, titleRef.current], { transformPerspective: P, z: -300, opacity: 0, overwrite: true });

    const st1 = ScrollTrigger.create({
      trigger: scrollEl,
      start: `${enterStart}% top`,
      end:   `${enterEnd}% top`,
      scrub: 0.8,
      onUpdate: (self) => {
        const p = self.progress;
        gsap.set(labelRef.current, { transformPerspective: P, z: -300 + p * 300, opacity: p });
        gsap.set(titleRef.current, { transformPerspective: P, z: -300 + p * 300, opacity: p });
      },
    });

    const st2 = ScrollTrigger.create({
      trigger: scrollEl,
      start: `${activeStart}% top`,
      end:   `${activeEnd}% top`,
      scrub: 1,
      onUpdate: (self) => {
        const p = self.progress;
        gsap.set(labelRef.current, { transformPerspective: P, z: p * 24 });
        gsap.set(titleRef.current, { transformPerspective: P, z: p * 70 });
      },
    });

    const st3 = ScrollTrigger.create({
      trigger: scrollEl,
      start: `${exitStart}% top`,
      end:   `${exitEnd}% top`,
      scrub: 0.8,
      onUpdate: (self) => {
        const p = self.progress;
        gsap.set(labelRef.current, { transformPerspective: P, z: 24  + p * 120, opacity: 1 - p });
        gsap.set(titleRef.current, { transformPerspective: P, z: 70  + p * 120, opacity: 1 - p });
      },
    });

    return () => { st1.kill(); st2.kill(); st3.kill(); };
  }, [scrollEl, phaseStart, phaseEnd]);

  const side = align === 'left'
    ? { left: 'clamp(16px, 5vw, 48px)' }
    : { right: 'clamp(16px, 5vw, 48px)' };

  return (
    <div
      ref={wrapRef}
      style={{
        position: 'fixed',
        ...side,
        top: 'clamp(72px, 10vh, 96px)',
        width: 'clamp(220px, 40vw, 480px)',
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
          marginBottom: '10px',
          opacity: 0,
        }}
      >
        <p
          style={{
            fontFamily: 'var(--font-space-grotesk)',
            fontSize: '10px',
            fontWeight: 600,
            letterSpacing: '0.32em',
            color: 'rgba(255,255,255,0.38)',
            margin: 0,
          }}
        >
          {label}
        </p>
      </div>

      <h2
        ref={titleRef}
        style={{
          fontFamily: 'var(--font-space-grotesk)',
          fontWeight: 700,
          fontSize: 'clamp(38px, 5vw, 64px)',
          lineHeight: 0.92,
          margin: 0,
          letterSpacing: '-0.03em',
          color: '#fff',
          opacity: 0,
          whiteSpace: 'pre-line',
        }}
      >
        {title}
      </h2>
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
  const lenis    = useLenis();

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
        left: 'clamp(16px, 5vw, 48px)',
        pointerEvents: 'none',
        zIndex: 20,
      }}
    >
      <div style={{ marginBottom: '14px' }}>
        <p ref={labelRef} style={{ fontFamily: 'var(--font-space-grotesk)', fontSize: '10px', fontWeight: 600, letterSpacing: '0.32em', color: 'rgba(255,255,255,0.38)', margin: 0 }}>
          PORTFOLIO — 2026
        </p>
      </div>

      <div style={{ fontSize: 'clamp(44px, 7vw, 96px)', lineHeight: 0.95 }}>
        <h1
          ref={nameRef}
          className="hero-name-outlined"
          style={{ fontSize: 'inherit', lineHeight: 'inherit', margin: 0 }}
        >
          SRI<br />ATRAGADA
        </h1>
      </div>

      <p ref={roleRef} style={{ fontFamily: 'var(--font-space-grotesk)', fontWeight: 400, fontSize: 'clamp(12px, 1.4vw, 14px)', color: 'rgba(255,255,255,0.45)', letterSpacing: '0.12em', marginTop: '24px' }}>
        Developer<span style={{ color: 'rgba(255,255,255,0.2)', margin: '0 10px' }}>/</span>Engineer<span style={{ color: 'rgba(255,255,255,0.2)', margin: '0 10px' }}>/</span>Builder
      </p>

      <div
        ref={ctaRef}
        style={{ marginTop: '32px', pointerEvents: 'auto' }}
      >
        <button
          onClick={() => lenis?.scrollTo(document.documentElement.scrollHeight * PHASES[1].start)}
          style={{
            fontFamily: 'var(--font-space-grotesk)',
            fontSize: '11px',
            fontWeight: 600,
            letterSpacing: '0.22em',
            color: '#fff',
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.3)',
            padding: '12px 28px',
            cursor: 'pointer',
            transition: 'border-color 0.2s, background 0.2s',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.7)'; (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.05)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.3)'; (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
        >
          EXPLORE THE UNIVERSE
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
      <div style={{ width: '1px', height: '40px', background: 'linear-gradient(to bottom, rgba(255,255,255,0.5), transparent)' }} />
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
            dot.style.background = self.progress > 0 && self.progress < 1 ? '#fff' : 'rgba(255,255,255,0.2)';
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
          style={{ width: '2px', height: '16px', background: i === 0 ? '#fff' : 'rgba(255,255,255,0.2)', transition: 'background 0.3s' }}
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
      <span style={{
        fontFamily: 'var(--font-space-grotesk)',
        fontSize: '10px',
        fontWeight: 600,
        letterSpacing: '0.28em',
        color: 'rgba(255,255,255,0.4)',
      }}>
        DRAG TO EXPLORE
      </span>
      <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.25)' }} />
    </div>
  );
}

// ── Firefly hint (Phase 5 only) ───────────────────────────────────────────
function FireflyHint({ scrollEl }: { scrollEl: HTMLElement | null }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!scrollEl || !ref.current) return;

    const phase = PHASES[5];
    const showStart = pct(phase.start);
    // Visible for the first 40% of Phase 5, then fades out
    const showEnd = pct(phase.start + (phase.end - phase.start) * 0.4);

    const st = ScrollTrigger.create({
      trigger: scrollEl,
      start: `${showStart}% top`,
      end: `${showEnd}% top`,
      scrub: 0.6,
      onUpdate: (self) => {
        if (!ref.current) return;
        const p = self.progress;
        const opacity = p < 0.15 ? p / 0.15 : p > 0.7 ? (1 - p) / 0.3 : 1;
        ref.current.style.opacity = String(Math.min(1, Math.max(0, opacity)));
      },
    });

    return () => st.kill();
  }, [scrollEl]);

  return (
    <div
      ref={ref}
      style={{
        position: 'fixed',
        top: '80px',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '10px',
        pointerEvents: 'none',
        zIndex: 30,
        opacity: 0,
      }}
    >
      <span
        style={{
          fontFamily: 'var(--font-space-grotesk)',
          fontSize: '10px',
          fontWeight: 600,
          letterSpacing: '0.28em',
          color: 'rgba(255,255,255,0.4)',
          whiteSpace: 'nowrap',
        }}
      >
        CLICK THE GLOWING ORBS TO EXPLORE
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

      {/* Hero panel — Phase 0 */}
      <HeroPanel scrollEl={scrollEl} />
      <ScrollIndicator scrollEl={scrollEl} />

      {/* Phase overlay panels — depth-layered GSAP text per phase */}
      <PhasePanel
        scrollEl={scrollEl}
        phaseStart={pct(PHASES[1].start)} phaseEnd={pct(PHASES[1].end)}
        label="ABOUT ME" title={'WHO I\nAM'}
        icon={<Sparkles size={14} />} align="left"
      >
        <p>CS + Finance at Stony Brook University. I build full-stack applications, scalable backend systems, and AI-driven platforms. Click the orb to learn more.</p>
      </PhasePanel>

      <PhasePanel
        scrollEl={scrollEl}
        phaseStart={pct(PHASES[2].start)} phaseEnd={pct(PHASES[2].end)}
        label="EXPERIENCE" title={'MY\nJOURNEY'}
        icon={<Layers size={14} />} align="right"
      >
        <p>From NLP pipelines at Stony Brook to AWS infrastructure at Atlas Legacy. Explore my work history by clicking the hotspots around the track.</p>
      </PhasePanel>

      <PhasePanel
        scrollEl={scrollEl}
        phaseStart={pct(PHASES[3].start)} phaseEnd={pct(PHASES[3].end)}
        label="PROJECTS" title={'WHAT I\nBUILD'}
        icon={<Code size={14} />} align="left"
      >
        <p>Open-world RPGs, real-time AI fitness platforms, and low-latency C++ trading engines. Tap a glowing hotspot to dive into each project.</p>
      </PhasePanel>

      <PhasePanel
        scrollEl={scrollEl}
        phaseStart={pct(PHASES[4].start)} phaseEnd={pct(PHASES[4].end)}
        label="SKILLS" title={'TECH\nSTACK'}
        icon={<Cpu size={14} />} align="right"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
          <div><span style={{ color: 'var(--noir-cyan)', letterSpacing: '0.15em', fontSize: '10px', fontWeight: 700 }}>LANGUAGES</span><br />Python · TypeScript · C++ · Java · SQL</div>
          <div><span style={{ color: 'var(--noir-cyan)', letterSpacing: '0.15em', fontSize: '10px', fontWeight: 700 }}>FRAMEWORKS & AI</span><br />React · FastAPI · LangChain · Spring Boot</div>
          <div><span style={{ color: 'var(--noir-cyan)', letterSpacing: '0.15em', fontSize: '10px', fontWeight: 700 }}>CLOUD & INFRA</span><br />AWS ECS · Docker · GitHub Actions · Pinecone</div>
        </div>
      </PhasePanel>

      <PhasePanel
        scrollEl={scrollEl}
        phaseStart={pct(PHASES[5].start)} phaseEnd={pct(PHASES[5].end)}
        label="EXPLORE" title={'CATCH\nTHEM ALL'}
        icon={<Mountain size={14} />} align="left"
      >
        <p>Four glowing orbs drift through the enchanted forest — each one holds a piece of my technical story. Click all four to unlock something special.</p>
      </PhasePanel>

      <PhasePanel
        scrollEl={scrollEl}
        phaseStart={pct(PHASES[6].start)} phaseEnd={pct(PHASES[6].end)}
        label="CONTACT" title={"LET'S\nCONNECT"}
        icon={<Rocket size={14} />} align="right"
      >
        <p>The journey ends here — and the next one begins. I&apos;m always open to new opportunities, collaborations, and conversations. Reach out anytime.</p>
        <p style={{ marginTop: '12px', color: 'var(--noir-cyan)', fontSize: '13px' }}>sridharatragada@gmail.com</p>
      </PhasePanel>

      {/* Phase progress dots */}
      <PhaseDots scrollEl={scrollEl} />

      {/* Black flash at every phase transition */}
      <TransitionFlash scrollEl={scrollEl} />

      {/* Blinking Drag Indicator for photo spheres (phases 3–5) */}
      <DragIndicator />

      {/* Phase 5 — hint to click the firefly orbs */}
      <FireflyHint scrollEl={scrollEl} />
    </>
  );
}
