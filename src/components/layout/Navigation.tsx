'use client';

import Link from 'next/link';
import { savePortfolioProgress } from '@/lib/portfolioScrollMemory';
import { scrollStore } from '@/lib/scrollStore';
import { FaGithub, FaLinkedin } from 'react-icons/fa';
import { motion } from 'framer-motion';

export default function Navigation() {
  return (
    <nav className="pointer-events-none fixed left-0 right-0 top-0 z-50 flex justify-center px-6 py-4">
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
        className="pointer-events-auto flex items-center justify-center gap-8 rounded-full border border-white/5 bg-black/20 px-8 py-4 backdrop-blur-xl"
        style={{
          boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
        }}
      >
        {/* Brand wordmark */}
        <Link
          href="/"
          className="text-spider-white transition-all hover:text-white"
          style={{
            fontFamily: 'var(--font-space-grotesk)',
            fontSize: '18px',
            fontWeight: 700,
            letterSpacing: '0.2em',
            textDecoration: 'none',
            textTransform: 'uppercase',
          }}
        >
          Sri Atragada
        </Link>

        {/* Resume link */}
        <Link
          href="/resume"
          onClick={() => savePortfolioProgress(scrollStore.globalProgress)}
          className="group relative flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-white/70 transition-all duration-300 hover:border-white/30 hover:bg-white/10 hover:text-white"
          style={{ fontFamily: 'var(--font-space-grotesk)', fontSize: '11px', fontWeight: 600, letterSpacing: '0.18em' }}
        >
          RÉSUMÉ
          <span className="absolute inset-0 rounded-full bg-white opacity-0 blur-md transition-opacity duration-300 group-hover:opacity-10" />
        </Link>

        {/* Social Icons */}
        <div className="flex items-center gap-4">
          <Link
            href="https://github.com/sriaratragada"
            target="_blank"
            rel="noopener noreferrer"
            className="group relative flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70 transition-all duration-300 hover:border-white/30 hover:bg-white/10 hover:text-white"
            aria-label="GitHub"
          >
            <FaGithub size={18} />
            {/* Glow effect on hover */}
            <span className="absolute inset-0 rounded-full bg-white opacity-0 blur-md transition-opacity duration-300 group-hover:opacity-20" />
          </Link>
          <Link
            href="https://linkedin.com/in/sri-atragada"
            target="_blank"
            rel="noopener noreferrer"
            className="group relative flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70 transition-all duration-300 hover:border-white/30 hover:bg-white/10 hover:text-white"
            aria-label="LinkedIn"
          >
            <FaLinkedin size={18} />
            {/* Glow effect on hover */}
            <span className="absolute inset-0 rounded-full bg-white opacity-0 blur-md transition-opacity duration-300 group-hover:opacity-20" />
          </Link>
        </div>
      </motion.div>
    </nav>
  );
}
