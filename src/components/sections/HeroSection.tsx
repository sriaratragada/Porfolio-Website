'use client';

// ── Hero Section ──────────────────────────────────────────────────────────────
// Game HUD layout — text in lower-left corner, 3D canvas visible above.
// 3D text effect: each element has individual CSS perspective + translateZ.
// On load: elements enter from z=-200 (far back) → z=0, staggered.
// On scroll: depth layers separate — name pushes out furthest (z+80),
//            role mid (z+40), label shallow (z+20). Like paper cut-out depth.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { scrollStore } from '@/lib/scrollStore';

gsap.registerPlugin(ScrollTrigger);

const PERSPECTIVE = 800; // px — shared value, consistent vanishing point feel

export default function HeroSection() {
  const sectionRef   = useRef<HTMLElement>(null);
  const hudRef       = useRef<HTMLDivElement>(null);
  const labelRef     = useRef<HTMLParagraphElement>(null);
  const nameRef      = useRef<HTMLHeadingElement>(null);
  const roleRef      = useRef<HTMLParagraphElement>(null);
  const ctaRef       = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sectionRef.current) return;

    const ctx = gsap.context(() => {
      // ── Entrance: all elements fly in from z=-200 (far behind), staggered ──
      // GSAP's transformPerspective applies perspective() to that element's own transform
      const enterDefaults = { transformPerspective: PERSPECTIVE, ease: 'power3.out' };

      gsap.from(labelRef.current, { ...enterDefaults, z: -200, opacity: 0, duration: 1.0, delay: 0.25 });
      gsap.from(nameRef.current,  { ...enterDefaults, z: -200, opacity: 0, duration: 1.1, delay: 0.4  });
      gsap.from(roleRef.current,  { ...enterDefaults, z: -200, opacity: 0, duration: 1.0, delay: 0.6  });
      gsap.from(ctaRef.current,   { ...enterDefaults, z: -200, opacity: 0, duration: 0.9, delay: 0.8  });
      gsap.from(indicatorRef.current, { opacity: 0, duration: 0.6, delay: 1.2 });

      // ── Scroll-driven depth layers ─────────────────────────────────────────
      // As user scrolls, each layer moves to a different Z — separating in 3D space.
      // Name is closest (pushes out furthest), label stays nearly flat.
      ScrollTrigger.create({
        trigger: sectionRef.current,
        start: 'top top',
        end: 'bottom top',
        onUpdate: (self) => {
          // heroProgress removed — scroll state now via globalProgress only
          const p = self.progress;

          // Depth parallax — each element at its own Z layer
          gsap.set(labelRef.current, { transformPerspective: PERSPECTIVE, z: p * 22  });
          gsap.set(nameRef.current,  { transformPerspective: PERSPECTIVE, z: p * 80  });
          gsap.set(roleRef.current,  { transformPerspective: PERSPECTIVE, z: p * 42  });
          gsap.set(ctaRef.current,   { transformPerspective: PERSPECTIVE, z: p * 18  });

          // HUD fades + drifts up as user scrolls past hero
          const fade = Math.max(0, 1 - p * 1.7);
          const ty   = p * -24;
          gsap.set(hudRef.current,       { opacity: fade, y: ty });
          gsap.set(indicatorRef.current, { opacity: Math.max(0, 1 - p * 4) });
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} id="hero" className="relative min-h-[250vh]">

      {/* Sticky viewport — 3D canvas shows through */}
      <div className="sticky top-0 h-screen" style={{ pointerEvents: 'none' }}>

        {/* Cinematic letterbox bars */}
        <div className="letterbox-bar letterbox-top" />
        <div className="letterbox-bar letterbox-bottom" />

        {/* ── Game HUD — lower-left, minimal footprint ──────────────── */}
        <div
          ref={hudRef}
          className="absolute z-20"
          style={{ bottom: '72px', left: '48px', pointerEvents: 'none' }}
        >
          {/* Label — shallowest layer */}
          <p
            ref={labelRef}
            style={{
              fontFamily: 'var(--font-bebas)',
              fontSize: '11px',
              letterSpacing: '0.18em',
              color: '#e62429',
              marginBottom: '10px',
              opacity: 0.85,
            }}
          >
            PORTFOLIO — 2026
          </p>

          {/* Name — deepest layer, pushes out most on scroll */}
          <h1
            ref={nameRef}
            style={{
              fontFamily: 'var(--font-bebas)',
              fontSize: 'clamp(52px, 8vw, 96px)',
              lineHeight: 0.88,
              color: '#f0f0f0',
              textShadow: '3px 3px 0 #e62429',
              letterSpacing: '0.02em',
            }}
          >
            YOUR<br />NAME
          </h1>

          {/* Role — mid layer */}
          <p
            ref={roleRef}
            style={{
              fontFamily: 'var(--font-comic)',
              fontSize: '15px',
              color: 'rgba(170,187,255,0.75)',
              marginTop: '14px',
              letterSpacing: '0.04em',
            }}
          >
            Developer&ensp;·&ensp;Creator&ensp;·&ensp;Web Slinger
          </p>

          {/* CTA row — shallowest, re-enable pointer events for clicks */}
          <div
            ref={ctaRef}
            style={{ marginTop: '20px', display: 'flex', gap: '12px', pointerEvents: 'auto' }}
          >
            <a
              href="#projects"
              style={{
                fontFamily: 'var(--font-bebas)',
                fontSize: '13px',
                letterSpacing: '0.15em',
                padding: '10px 22px',
                border: '2px solid #e62429',
                background: '#e62429',
                color: '#fff',
                textDecoration: 'none',
                transition: 'background 0.2s, color 0.2s',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.background = 'transparent';
                (e.currentTarget as HTMLElement).style.color = '#e62429';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.background = '#e62429';
                (e.currentTarget as HTMLElement).style.color = '#fff';
              }}
            >
              VIEW WORK
            </a>
            <a
              href="#bio"
              style={{
                fontFamily: 'var(--font-bebas)',
                fontSize: '13px',
                letterSpacing: '0.15em',
                padding: '10px 22px',
                border: '2px solid rgba(240,240,240,0.3)',
                background: 'transparent',
                color: 'rgba(240,240,240,0.6)',
                textDecoration: 'none',
                transition: 'border-color 0.2s, color 0.2s',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.borderColor = '#f0f0f0';
                (e.currentTarget as HTMLElement).style.color = '#f0f0f0';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(240,240,240,0.3)';
                (e.currentTarget as HTMLElement).style.color = 'rgba(240,240,240,0.6)';
              }}
            >
              ABOUT ME
            </a>
          </div>
        </div>

        {/* Scroll indicator — bottom right */}
        <div
          ref={indicatorRef}
          style={{
            position: 'absolute',
            bottom: '72px',
            right: '48px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
            pointerEvents: 'none',
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-bebas)',
              fontSize: '10px',
              letterSpacing: '0.3em',
              color: 'rgba(240,240,240,0.25)',
              writingMode: 'vertical-rl',
            }}
          >
            SCROLL
          </span>
          <div
            style={{
              width: '1px',
              height: '40px',
              background: 'linear-gradient(to bottom, rgba(230,36,41,0.6), transparent)',
              animation: 'pulse 2s ease-in-out infinite',
            }}
          />
        </div>

      </div>
    </section>
  );
}
