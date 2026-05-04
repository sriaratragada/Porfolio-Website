import { cn } from '@/lib/cn';

interface HalftoneOverlayProps {
  className?: string;
}

export default function HalftoneOverlay({ className }: HalftoneOverlayProps) {
  return (
    <div
      className={cn(
        'pointer-events-none absolute inset-0 z-10 halftone-overlay',
        className
      )}
    />
  );
}
