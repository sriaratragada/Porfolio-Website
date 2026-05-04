'use client';

import { useRef, useEffect, useState } from 'react';
import { cn } from '@/lib/cn';

interface SoundEffectProps {
  text: string;
  color?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeMap = {
  sm: 'text-3xl',
  md: 'text-5xl',
  lg: 'text-7xl',
};

export default function SoundEffect({
  text,
  color = '#e62429',
  size = 'md',
  className,
}: SoundEffectProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={cn(
        'pointer-events-none select-none',
        visible ? 'sound-effect-enter' : 'opacity-0 scale-0',
        className
      )}
    >
      <svg
        viewBox="0 0 200 120"
        className={cn('w-full', sizeMap[size])}
        style={{ filter: `drop-shadow(2px 2px 0 ${color})` }}
      >
        <polygon
          points="100,5 130,20 195,15 160,45 180,95 120,70 100,115 80,70 20,95 40,45 5,15 70,20"
          fill={color}
          stroke="#000"
          strokeWidth="3"
        />
        <text
          x="100"
          y="68"
          textAnchor="middle"
          dominantBaseline="middle"
          fill="#fff"
          fontSize="32"
          fontWeight="bold"
          fontFamily="var(--font-bangers), Bangers, cursive"
          stroke="#000"
          strokeWidth="1.5"
        >
          {text}
        </text>
      </svg>
    </div>
  );
}
