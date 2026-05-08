import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Resume | Sri Atragada',
};

export default function ResumePage() {
  return (
    <div className="w-full h-screen bg-black flex flex-col items-center justify-center p-4">
      {/* Back button */}
      <div className="absolute top-8 left-8">
        <a href="/" className="text-white/70 hover:text-white flex items-center gap-2 transition-colors uppercase tracking-widest text-sm font-bold" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          BACK TO PORTFOLIO
        </a>
      </div>

      <div className="max-w-4xl w-full h-[85vh] flex flex-col items-center gap-6 mt-12">
        <div className="w-full flex justify-between items-center px-4">
          <h1 className="text-2xl text-white font-bold tracking-widest uppercase" style={{ fontFamily: 'var(--font-space-grotesk)' }}>Resume</h1>
          <a href="/Sri-Atragada-Resume.pdf" download className="px-6 py-2 bg-white text-black font-bold uppercase tracking-widest text-sm rounded-full hover:bg-gray-200 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.3)]">
            Download PDF
          </a>
        </div>
        
        {/* PDF Viewer */}
        <div className="w-full flex-grow rounded-xl overflow-hidden border border-white/20 shadow-[0_0_50px_rgba(255,255,255,0.1)]">
          <iframe 
            src="/Sri-Atragada-Resume.pdf" 
            className="w-full h-full bg-white"
            title="Resume PDF Viewer"
          />
        </div>
      </div>
    </div>
  );
}
