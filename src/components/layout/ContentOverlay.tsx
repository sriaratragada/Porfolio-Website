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
}

function PhasePanel({ scrollEl, phaseStart, phaseEnd, label, title, children, align = 'left' }: PanelProps) {
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
      <p
        ref={labelRef}
        style={{
          fontFamily: 'var(--font-bebas)',
          fontSize: '11px',
          letterSpacing: '0.2em',
          color: '#e62429',
          marginBottom: '8px',
          opacity: 0,
        }}
      >
        {label}
      </p>

      <h2
        ref={titleRef}
        style={{
          fontFamily: 'var(--font-bebas)',
          fontSize: 'clamp(40px, 5.5vw, 80px)',
          lineHeight: 0.88,
          color: '#f0f0f0',
          textShadow: '2px 2px 0 rgba(230,36,41,0.6)',
          letterSpacing: '0.02em',
          opacity: 0,
        }}
      >
        {title}
      </h2>

      <div
        ref={bodyRef}
        style={{ marginTop: '20px', color: 'rgba(240,240,240,0.75)', fontSize: '14px', lineHeight: 1.6, opacity: 0 }}
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
      <p ref={labelRef} className="portfolio-label" style={{ marginBottom: '14px' }}>
        PORTFOLIO — 2026
      </p>

      {/* Outer div carries data-text for the CSS ::before glitch ghost */}
      <div
        className="hero-name-wrap"
        data-text={'YOUR\nNAME'}
        style={{ fontSize: 'clamp(52px, 8vw, 96px)', lineHeight: 0.92 }}
      >
        <h1
          ref={nameRef}
          className="hero-name-outlined"
          style={{ fontSize: 'inherit', lineHeight: 'inherit' }}
        >
          YOUR<br />NAME
        </h1>
      </div>

      <p ref={roleRef} className="tagline-mono" style={{ marginTop: '22px' }}>
        Developer<span className="sep">//</span>Creator<span className="sep">//</span>Web Slinger
      </p>

      <div
        ref={ctaRef}
        style={{ marginTop: '20px', display: 'flex', gap: '12px', pointerEvents: 'auto' }}
      >
        <a
          href="#bio"
          style={{ fontFamily: 'var(--font-bebas)', fontSize: '13px', letterSpacing: '0.15em', padding: '10px 22px', border: '2px solid #e62429', background: '#e62429', color: '#fff', textDecoration: 'none', transition: 'background 0.2s, color 0.2s' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#e62429'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#e62429'; (e.currentTarget as HTMLElement).style.color = '#fff'; }}
        >
          EXPLORE
        </a>
        <Link
          href="/blog"
          style={{ fontFamily: 'var(--font-bebas)', fontSize: '13px', letterSpacing: '0.15em', padding: '10px 22px', border: '2px solid rgba(240,240,240,0.3)', background: 'transparent', color: 'rgba(240,240,240,0.6)', textDecoration: 'none', transition: 'border-color 0.2s, color 0.2s' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#f0f0f0'; (e.currentTarget as HTMLElement).style.color = '#f0f0f0'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(240,240,240,0.3)'; (e.currentTarget as HTMLElement).style.color = 'rgba(240,240,240,0.6)'; }}
        >
          BLOG
        </Link>
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

      {/* Phase 0 — Manhattan intro */}
      <HeroPanel scrollEl={scrollEl} />
      <ScrollIndicator scrollEl={scrollEl} />

      {/* Phase 1 — Battle Bus */}
      <PhasePanel
        scrollEl={scrollEl}
        phaseStart={pct(PHASES[1].start)}
        phaseEnd={pct(PHASES[1].end)}
        label="ABOUT ME — PHASE 01"
        title={"WHO\nI AM"}
        align="left"
      >
        <p style={{ fontFamily: 'var(--font-comic)' }}>
          The camera circles the iconic Fortnite Battle Bus drifting high above the clouds — a golden vehicle carrying you into the unknown. Just like dropping from the bus, every project starts with a leap.
        </p>
        <ul style={{ marginTop: '14px', paddingLeft: '0', listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {['React / Next.js', 'Three.js / WebGL', 'TypeScript', 'Node.js / PostgreSQL'].map((skill) => (
            <li key={skill} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontFamily: 'var(--font-bebas)', fontSize: '14px', letterSpacing: '0.1em', color: 'rgba(240,240,240,0.7)' }}>
              <span style={{ width: '20px', height: '1px', background: '#e62429', flexShrink: 0 }} />
              {skill}
            </li>
          ))}
        </ul>
      </PhasePanel>

      {/* Phase 2 — Race Track */}
      <PhasePanel
        scrollEl={scrollEl}
        phaseStart={pct(PHASES[2].start)}
        phaseEnd={pct(PHASES[2].end)}
        label="EXPERIENCE — PHASE 02"
        title={"THE\nJOURNEY"}
        align="left"
      >
        <p style={{ fontFamily: 'var(--font-comic)' }}>
          A dragon's domain — ancient, vast, and commanding. The camera sweeps around a towering mythical landscape as the environment slowly rotates. Each role I've held shaped the scale of what I can build.
        </p>
        {[
          { company: 'Company Name', role: 'Senior Developer', period: '2023 – Present' },
          { company: 'Previous Co', role: 'Full Stack Dev',    period: '2021 – 2023'    },
          { company: 'First Start', role: 'Junior Developer',  period: '2019 – 2021'    },
        ].map((job) => (
          <div key={job.company} style={{ marginBottom: '16px', paddingLeft: '12px', borderLeft: '2px solid #e62429' }}>
            <p style={{ fontFamily: 'var(--font-bebas)', fontSize: '16px', letterSpacing: '0.08em', color: '#f0f0f0' }}>{job.company}</p>
            <p style={{ fontFamily: 'var(--font-comic)', fontSize: '13px', color: 'rgba(170,187,255,0.8)' }}>{job.role}</p>
            <p style={{ fontFamily: 'var(--font-comic)', fontSize: '11px', color: 'rgba(240,240,240,0.4)', marginTop: '2px' }}>{job.period}</p>
          </div>
        ))}
      </PhasePanel>

      {/* Phase 3 — Jungle 360° */}
      <PhasePanel
        scrollEl={scrollEl}
        phaseStart={pct(PHASES[3].start)}
        phaseEnd={pct(PHASES[3].end)}
        label="PROJECTS — PHASE 03"
        title={"WHAT\nI BUILT"}
        align="left"
      >
        <p style={{ fontFamily: 'var(--font-comic)' }}>
          You are now inside an anime sky panorama — a hand-painted world of drifting clouds, warm light, and endless horizon. The camera orbits gently through this living painting, just as these projects came to life through craft and iteration.
        </p>
        {[
          { title: 'Project Alpha', tags: ['React', 'Three.js', 'WebGL'] },
          { title: 'Project Beta',  tags: ['Next.js', 'Socket.io', 'PostgreSQL'] },
          { title: 'Project Gamma', tags: ['TypeScript', 'Node.js', 'CLI'] },
        ].map((proj) => (
          <div key={proj.title} style={{ marginBottom: '16px' }}>
            <p style={{ fontFamily: 'var(--font-bebas)', fontSize: '18px', letterSpacing: '0.06em', color: '#f0f0f0' }}>{proj.title}</p>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '5px' }}>
              {proj.tags.map((tag) => (
                <span key={tag} style={{ fontFamily: 'var(--font-bebas)', fontSize: '10px', letterSpacing: '0.12em', padding: '3px 8px', border: '1px solid rgba(230,36,41,0.5)', color: 'rgba(230,36,41,0.9)' }}>
                  {tag}
                </span>
              ))}
            </div>
          </div>
        ))}
      </PhasePanel>

      {/* Phase 4 — Above the Clouds */}
      <PhasePanel
        scrollEl={scrollEl}
        phaseStart={pct(PHASES[4].start)}
        phaseEnd={pct(PHASES[4].end)}
        label="SKILLS — PHASE 04"
        title={"ABOVE\nTHE CLOUDS"}
        align="right"
      >
        <p style={{ fontFamily: 'var(--font-comic)' }}>
          Breaking through the cloud line, snowy peaks stretch to the horizon in every direction. You are orbiting inside a 360° mountain skybox — a reminder that the view from the top is earned, not given.
        </p>
      </PhasePanel>

      {/* Phase 5 — Enchanted Forest */}
      <PhasePanel
        scrollEl={scrollEl}
        phaseStart={pct(PHASES[5].start)}
        phaseEnd={pct(PHASES[5].end)}
        label="CONTACT — PHASE 05"
        title={"ENCHANTED\nFOREST"}
        align="left"
      >
        <p style={{ fontFamily: 'var(--font-comic)' }}>
          Ancient trees tower overhead as the camera drifts through a glowing enchanted forest. Light filters through every branch — a world that rewards those who look closely. Let's build something worth exploring.
        </p>
      </PhasePanel>

      {/* Phase 6 — Imperial Hangar */}
      <PhasePanel
        scrollEl={scrollEl}
        phaseStart={pct(PHASES[6].start)}
        phaseEnd={pct(PHASES[6].end)}
        label="FINAL — PHASE 06"
        title={"STAR\nDESTROYER"}
        align="right"
      >
        <p style={{ fontFamily: 'var(--font-comic)' }}>
          Inside a Star Destroyer hangar — cold steel, towering scale, and the hum of something immense. The camera orbits the interior of an Imperial warship. This is where the journey ends… and the next one begins.
        </p>
      </PhasePanel>

      {/* Phase progress dots */}
      <PhaseDots scrollEl={scrollEl} />

      {/* Black flash at every phase transition */}
      <TransitionFlash scrollEl={scrollEl} />

      {/* Blinking Drag Indicator for photo spheres */}
      <DragIndicator />
    </>
  );
}
