'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import ComicPanel from '@/components/comic/ComicPanel';
import ComicGrid from '@/components/comic/ComicGrid';
import GlitchText from '@/components/comic/GlitchText';
import SoundEffect from '@/components/comic/SoundEffect';

gsap.registerPlugin(ScrollTrigger);

const projects = [
  {
    title: 'Project Alpha',
    description: 'A cutting-edge web application built with React and Three.js, featuring immersive 3D experiences.',
    tags: ['React', 'Three.js', 'WebGL'],
    color: '#e62429',
  },
  {
    title: 'Project Beta',
    description: 'Full-stack application with real-time collaboration features and a modern, responsive design.',
    tags: ['Next.js', 'Socket.io', 'PostgreSQL'],
    color: '#2196F3',
  },
  {
    title: 'Project Gamma',
    description: 'Open source developer tool that streamlines workflow and boosts productivity for teams.',
    tags: ['TypeScript', 'Node.js', 'CLI'],
    color: '#e62429',
  },
  {
    title: 'Project Delta',
    description: 'Mobile-first progressive web app with offline support and native-like performance.',
    tags: ['PWA', 'React', 'Service Workers'],
    color: '#2196F3',
  },
];

export default function ProjectsSection() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!sectionRef.current) return;

    const ctx = gsap.context(() => {
      const cards = sectionRef.current!.querySelectorAll('.project-card');
      gsap.fromTo(
        cards,
        { opacity: 0, y: 80, rotateZ: -2 },
        {
          opacity: 1,
          y: 0,
          rotateZ: 0,
          duration: 0.7,
          stagger: 0.12,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 65%',
          },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} id="projects" className="section-container">
      <div className="relative mb-16">
        <h2
          className="text-center text-5xl tracking-wider text-spider-white md:text-6xl"
          style={{ fontFamily: 'var(--font-bangers)' }}
        >
          PROJECTS
        </h2>
        <div className="absolute -right-4 -top-6 hidden md:block">
          <SoundEffect text="THWIP!" color="#2196F3" size="sm" />
        </div>
      </div>

      <ComicGrid layout="two-column">
        {projects.map((project, i) => (
          <div key={i} className="project-card">
            <ComicPanel
              rotation={i % 2 === 0 ? -0.8 : 0.8}
              variant={i % 2 === 0 ? 'accent' : 'highlight'}
              className="group cursor-pointer transition-all duration-300 hover:border-spider-red hover:shadow-[0_0_20px_rgba(230,36,41,0.15)]"
            >
              {/* Project thumbnail placeholder */}
              <div
                className="mb-4 flex h-40 items-center justify-center rounded-sm"
                style={{
                  background: `linear-gradient(135deg, ${project.color}15, ${project.color}05)`,
                  borderBottom: `2px solid ${project.color}30`,
                }}
              >
                <span
                  className="text-4xl opacity-40"
                  style={{ fontFamily: 'var(--font-bangers)', color: project.color }}
                >
                  {String(i + 1).padStart(2, '0')}
                </span>
              </div>

              <GlitchText
                as="h3"
                className="mb-2 text-xl text-spider-white"
              >
                <span style={{ fontFamily: 'var(--font-bangers)' }}>
                  {project.title}
                </span>
              </GlitchText>

              <p className="mb-4 text-sm leading-relaxed text-spider-white/70">
                {project.description}
              </p>

              <div className="flex flex-wrap gap-1.5">
                {project.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-sm border px-2 py-0.5 text-xs font-bold uppercase tracking-wider"
                    style={{
                      borderColor: `${project.color}40`,
                      color: project.color,
                      background: `${project.color}10`,
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </ComicPanel>
          </div>
        ))}
      </ComicGrid>
    </section>
  );
}
