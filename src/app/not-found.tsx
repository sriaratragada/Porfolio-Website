import Link from 'next/link';
import ComicPanel from '@/components/comic/ComicPanel';
import SoundEffect from '@/components/comic/SoundEffect';

export default function NotFound() {
  return (
    <div className="section-container flex min-h-screen flex-col items-center justify-center pt-20 text-center">
      <div className="relative">
        <SoundEffect text="404!" color="#e62429" size="lg" />
      </div>
      <ComicPanel rotation={-1} variant="accent" className="mt-8 max-w-md">
        <h1
          className="mb-2 text-5xl text-spider-white"
          style={{ fontFamily: 'var(--font-bangers)' }}
        >
          PAGE NOT FOUND
        </h1>
        <p className="mb-6 text-spider-white/70">
          Spider-Man swung the wrong way. This page does not exist.
        </p>
        <Link
          href="/"
          className="inline-block rounded-sm border-2 border-spider-red bg-spider-red/10 px-6 py-2 font-bold uppercase tracking-widest text-spider-red transition-colors hover:bg-spider-red hover:text-white"
          style={{ fontFamily: 'var(--font-bangers)' }}
        >
          Swing Home
        </Link>
      </ComicPanel>
    </div>
  );
}
