'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import ComicPanel from '@/components/comic/ComicPanel';

gsap.registerPlugin(ScrollTrigger);

const experiences = [
  {
    company: 'Company Name',
    role: 'Senior Developer',
    period: '2023 - Present',
    description: 'Leading development of cutting-edge web applications with modern frameworks and 3D technologies.',
    skills: ['React', 'Three.js', 'TypeScript'],
  },
  {
    company: 'Previous Company',
    role: 'Full Stack Developer',
    period: '2021 - 2023',
    description: 'Built and maintained scalable web applications serving millions of users worldwide.',
    skills: ['Next.js', 'Node.js', 'PostgreSQL'],
  },
  {
    company: 'First Company',
    role: 'Junior Developer',
    period: '2019 - 2021',
    description: 'Started my journey building responsive websites and learning the fundamentals of software engineering.',
    skills: ['JavaScript', 'CSS', 'HTML'],
  },
];

export default function ResumeSection() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!sectionRef.current) return;

    const ctx = gsap.context(() => {
      const items = sectionRef.current!.querySelectorAll('.timeline-item');
      gsap.fromTo(
        items,
        { opacity: 0, y: 60 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          stagger: 0.15,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 60%',
          },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} id="resume" className="section-container">
      <h2
        className="mb-16 text-center text-5xl tracking-wider text-spider-white md:text-6xl"
        style={{ fontFamily: 'var(--font-bangers)' }}
      >
        EXPERIENCE
      </h2>

      <div className="relative mx-auto max-w-3xl">
        {/* Timeline line */}
        <div className="absolute left-1/2 top-0 h-full w-1 -translate-x-1/2 bg-gradient-to-b from-spider-red via-spider-red/50 to-transparent" />

        <div className="flex flex-col gap-12">
          {experiences.map((exp, i) => (
            <div
              key={i}
              className={`timeline-item relative flex ${
                i % 2 === 0 ? 'justify-start' : 'justify-end'
              }`}
            >
              {/* Dot on timeline */}
              <div className="absolute left-1/2 top-6 z-10 h-4 w-4 -translate-x-1/2 rounded-full border-2 border-spider-red bg-spider-dark" />

              <div className={`w-full md:w-5/12 ${i % 2 === 0 ? 'md:pr-8' : 'md:pl-8'}`}>
                <ComicPanel
                  rotation={i % 2 === 0 ? -0.5 : 0.5}
                  variant={i === 0 ? 'accent' : 'default'}
                >
                  <span className="text-xs font-bold uppercase tracking-widest text-spider-red">
                    {exp.period}
                  </span>
                  <h3
                    className="mt-1 text-xl text-spider-white"
                    style={{ fontFamily: 'var(--font-bangers)' }}
                  >
                    {exp.role}
                  </h3>
                  <p className="text-sm text-spider-blue">{exp.company}</p>
                  <p className="mt-3 text-sm leading-relaxed text-spider-white/70">
                    {exp.description}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {exp.skills.map((skill) => (
                      <span
                        key={skill}
                        className="rounded-sm bg-spider-white/5 px-2 py-0.5 text-xs text-spider-white/60"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </ComicPanel>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
