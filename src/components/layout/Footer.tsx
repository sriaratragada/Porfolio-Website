export default function Footer() {
  return (
    <footer className="relative z-10 border-t border-white/10 bg-spider-dark/80 px-6 py-12 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 text-center">
        <p
          className="text-xl tracking-wider text-spider-white/80"
          style={{ fontFamily: 'var(--font-bangers)' }}
        >
          Built with great power & great responsibility
        </p>
        <p className="text-sm text-spider-white/40">
          &copy; {new Date().getFullYear()} All rights reserved.
        </p>
      </div>
    </footer>
  );
}
