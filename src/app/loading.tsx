export default function Loading() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-spider-dark">
      <div className="relative">
        <svg
          viewBox="0 0 80 80"
          className="h-20 w-20 animate-spin"
          style={{ animationDuration: '2s' }}
        >
          <circle
            cx="40"
            cy="40"
            r="32"
            fill="none"
            stroke="#e62429"
            strokeWidth="3"
            strokeDasharray="50 150"
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-3 w-3 rounded-full bg-spider-red" />
        </div>
      </div>
      <p
        className="mt-6 animate-pulse text-xl tracking-widest text-spider-white/60"
        style={{ fontFamily: 'var(--font-bangers)' }}
      >
        SWINGING IN...
      </p>
    </div>
  );
}
