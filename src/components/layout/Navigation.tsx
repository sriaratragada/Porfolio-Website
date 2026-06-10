'use client';

import Link from 'next/link';
import { savePortfolioProgress } from '@/lib/portfolioScrollMemory';
import { scrollStore } from '@/lib/scrollStore';
import { FaGithub, FaLinkedin } from 'react-icons/fa';
import { motion } from 'framer-motion';

export default function Navigation() {
  return (
    <nav className="pointer-events-none fixed left-0 right-0 top-0 z-50 flex items-center px-8 py-5">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="pointer-events-auto flex w-full items-center justify-between"
      >
        {/* Brand wordmark */}
        <Link
          href="/"
          style={{
            fontFamily: 'var(--font-space-grotesk)',
            fontSize: '13px',
            fontWeight: 700,
            letterSpacing: '0.22em',
            textDecoration: 'none',
            color: '#fff',
            textTransform: 'uppercase',
          }}
        >
          Sri Atragada
        </Link>

        {/* Right side */}
        <div className="flex items-center gap-8">
          <Link
            href="/resume"
            onClick={() => savePortfolioProgress(scrollStore.globalProgress)}
            style={{
              fontFamily: 'var(--font-space-grotesk)',
              fontSize: '10px',
              fontWeight: 600,
              letterSpacing: '0.22em',
              color: 'rgba(255,255,255,0.45)',
              textDecoration: 'none',
              transition: 'color 0.2s',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.45)')}
          >
            RÉSUMÉ
          </Link>

          <div className="flex items-center gap-5">
            <Link
              href="https://github.com/sriaratragada"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/35 transition-colors duration-200 hover:text-white"
              aria-label="GitHub"
            >
              <FaGithub size={16} />
            </Link>
            <Link
              href="https://linkedin.com/in/sri-atragada"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/35 transition-colors duration-200 hover:text-white"
              aria-label="LinkedIn"
            >
              <FaLinkedin size={16} />
            </Link>
          </div>
        </div>
      </motion.div>
    </nav>
  );
}
