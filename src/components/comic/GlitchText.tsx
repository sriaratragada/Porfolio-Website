import { cn } from '@/lib/cn';
import type { ReactNode } from 'react';

interface GlitchTextProps {
  children: ReactNode;
  as?: 'h1' | 'h2' | 'h3' | 'span' | 'p';
  className?: string;
}

export default function GlitchText({
  children,
  as: Tag = 'span',
  className,
}: GlitchTextProps) {
  const text = typeof children === 'string' ? children : '';

  return (
    <Tag
      className={cn('glitch-text', className)}
      data-text={text}
    >
      {children}
    </Tag>
  );
}
