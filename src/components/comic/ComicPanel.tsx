'use client';

import { cn } from '@/lib/cn';
import type { ReactNode, CSSProperties } from 'react';

interface ComicPanelProps {
  children: ReactNode;
  rotation?: number;
  variant?: 'default' | 'accent' | 'highlight';
  className?: string;
  style?: CSSProperties;
}

const variantStyles = {
  default: 'border-panel-border',
  accent: 'border-spider-red/60',
  highlight: 'border-spider-blue/60',
};

export default function ComicPanel({
  children,
  rotation = 0,
  variant = 'default',
  className,
  style,
}: ComicPanelProps) {
  return (
    <div
      className={cn(
        'comic-panel rounded-sm p-6 transition-transform duration-300 hover:-translate-y-1',
        variantStyles[variant],
        className
      )}
      style={{
        transform: `rotate(${rotation}deg)`,
        ...style,
      }}
    >
      <div className="relative z-10">{children}</div>
    </div>
  );
}
