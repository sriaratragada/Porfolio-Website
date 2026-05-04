import { cn } from '@/lib/cn';
import type { ReactNode } from 'react';

interface ComicGridProps {
  children: ReactNode;
  layout?: 'hero-split' | 'three-column' | 'staggered' | 'two-column';
  className?: string;
}

const layoutStyles = {
  'hero-split': 'grid-cols-1 md:grid-cols-2',
  'three-column': 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
  'staggered': 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 [&>*:nth-child(odd)]:md:translate-y-4',
  'two-column': 'grid-cols-1 md:grid-cols-2',
};

export default function ComicGrid({
  children,
  layout = 'three-column',
  className,
}: ComicGridProps) {
  return (
    <div
      className={cn(
        'grid gap-4',
        layoutStyles[layout],
        className
      )}
    >
      {children}
    </div>
  );
}
