'use client';

import { useRouter } from 'next/navigation';
import { markPortfolioShouldRestore } from '@/lib/portfolioScrollMemory';

export default function BackButton() {
  const router = useRouter();

  return (
    <button 
      onClick={() => {
        markPortfolioShouldRestore();
        router.push('/');
      }}
      className="text-white/70 hover:text-white flex items-center gap-2 transition-colors uppercase tracking-widest text-sm font-bold cursor-pointer" 
      style={{ fontFamily: 'var(--font-space-grotesk)' }}
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
      </svg>
      BACK TO PORTFOLIO
    </button>
  );
}
