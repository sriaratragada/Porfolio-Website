'use client';

import { useState } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/cn';

const navItems = [
  { label: 'Home', href: '#hero' },
  { label: 'About', href: '#bio' },
  { label: 'Experience', href: '#resume' },
  { label: 'Projects', href: '#projects' },
  { label: 'Blog', href: '/blog' },
];

export default function Navigation() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4">
      <div className="mx-auto flex max-w-7xl items-center justify-between rounded-xl border border-white/10 bg-black/40 px-6 py-3 backdrop-blur-md">
        <Link
          href="/"
          className="font-[var(--font-bangers)] text-2xl tracking-wider text-spider-white transition-colors hover:text-spider-red"
          style={{ fontFamily: 'var(--font-bangers)' }}
        >
          PORTFOLIO
        </Link>

        {/* Desktop nav */}
        <div className="hidden gap-8 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="group relative text-sm font-bold uppercase tracking-widest text-spider-white/70 transition-colors hover:text-spider-white"
              style={{ fontFamily: 'var(--font-bangers)' }}
            >
              {item.label}
              <span className="absolute -bottom-1 left-0 h-0.5 w-0 bg-spider-red transition-all duration-300 group-hover:w-full" />
            </Link>
          ))}
        </div>

        {/* Mobile hamburger */}
        <button
          className="flex flex-col gap-1.5 md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          <span className={cn(
            'h-0.5 w-6 bg-spider-white transition-transform duration-300',
            mobileOpen && 'translate-y-2 rotate-45'
          )} />
          <span className={cn(
            'h-0.5 w-6 bg-spider-white transition-opacity duration-300',
            mobileOpen && 'opacity-0'
          )} />
          <span className={cn(
            'h-0.5 w-6 bg-spider-white transition-transform duration-300',
            mobileOpen && '-translate-y-2 -rotate-45'
          )} />
        </button>
      </div>

      {/* Mobile menu */}
      <div className={cn(
        'absolute left-4 right-4 top-20 rounded-xl border-2 border-panel-border bg-spider-dark/95 backdrop-blur-lg transition-all duration-300 md:hidden',
        mobileOpen ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0 pointer-events-none'
      )}>
        <div className="flex flex-col gap-4 p-6">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className="text-lg font-bold uppercase tracking-widest text-spider-white/70 transition-colors hover:text-spider-red"
              style={{ fontFamily: 'var(--font-bangers)' }}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
