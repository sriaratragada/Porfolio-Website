'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import ComicPanel from '@/components/comic/ComicPanel';
import ComicGrid from '@/components/comic/ComicGrid';
import SoundEffect from '@/components/comic/SoundEffect';

gsap.registerPlugin(ScrollTrigger);

export default function BioSection() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!sectionRef.current) return;

    const ctx = gsap.context(() => {
      const panels = sectionRef.current!.querySelectorAll('.bio-panel');
      gsap.fromTo(
        panels,
        { opacity: 0, x: (i) => (i === 0 ? -80 : 80) },
        {
          opacity: 1,
          x: 0,
          duration: 0.8,
          stagger: 0.2,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 70%',
          },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} id="bio" className="section-container">
      <h2
        className="mb-12 text-center text-5xl tracking-wider text-spider-white md:text-6xl"
        style={{ fontFamily: 'var(--font-bangers)' }}
      >
        ABOUT ME
      </h2>

      <div className="relative">
        <div className="absolute -right-8 -top-8 z-20 hidden md:block">
          <SoundEffect text="POW!" color="#e62429" size="sm" />
        </div>

        <ComicGrid layout="hero-split">
          <ComicPanel rotation={-1} variant="accent" className="bio-panel">
            <div className="flex aspect-square items-center justify-center rounded-sm bg-spider-dark/50">
              <div className="relative h-48 w-48 overflow-hidden rounded-full border-4 border-spider-red/30">
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-spider-red/20 to-spider-blue/20">
                  <span
                    className="text-6xl text-spider-white/60"
                    style={{ fontFamily: 'var(--font-bangers)' }}
                  >
                    ?
                  </span>
                </div>
              </div>
            </div>
          </ComicPanel>

          <ComicPanel rotation={0.5} className="bio-panel">
            <h3
              className="mb-4 text-2xl text-spider-red"
              style={{ fontFamily: 'var(--font-bangers)' }}
            >
              WHO AM I?
            </h3>
            <p className="mb-4 leading-relaxed text-spider-white/80">
              I&apos;m a passionate developer who builds amazing digital experiences.
              With a love for clean code and creative problem-solving, I bring ideas to life
              through the power of technology.
            </p>
            <p className="leading-relaxed text-spider-white/80">
              When I&apos;m not coding, you can find me exploring new technologies,
              contributing to open source, and pushing the boundaries of what&apos;s
              possible on the web.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {['React', 'TypeScript', 'Three.js', 'Next.js', 'Node.js'].map((skill) => (
                <span
                  key={skill}
                  className="rounded-sm border border-spider-red/30 bg-spider-red/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-spider-red"
                >
                  {skill}
                </span>
              ))}
            </div>
          </ComicPanel>
        </ComicGrid>
      </div>
    </section>
  );
}
