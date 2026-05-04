import Link from 'next/link';
import ComicPanel from '@/components/comic/ComicPanel';
import GlitchText from '@/components/comic/GlitchText';
import type { PostMeta } from '@/lib/mdx';

interface BlogCardProps {
  post: PostMeta;
  index: number;
}

export default function BlogCard({ post, index }: BlogCardProps) {
  const rotation = (index % 3 - 1) * 0.6;

  return (
    <Link href={`/blog/${post.slug}`} className="block">
      <ComicPanel
        rotation={rotation}
        variant={index % 2 === 0 ? 'accent' : 'default'}
        className="group cursor-pointer transition-all duration-300 hover:border-spider-red hover:shadow-[0_0_20px_rgba(230,36,41,0.15)]"
      >
        {/* Cover image placeholder */}
        <div className="halftone-overlay relative mb-4 flex h-36 items-center justify-center rounded-sm bg-gradient-to-br from-spider-red/10 to-spider-blue/10">
          <span
            className="text-5xl text-spider-white/20"
            style={{ fontFamily: 'var(--font-bangers)' }}
          >
            {String(index + 1).padStart(2, '0')}
          </span>
        </div>

        <div className="flex items-center gap-3 text-xs text-spider-white/40">
          <time>{post.date}</time>
          <span>&bull;</span>
          <span>{post.readingTime}</span>
        </div>

        <GlitchText as="h3" className="mt-2 text-xl text-spider-white">
          <span style={{ fontFamily: 'var(--font-bangers)' }}>
            {post.title}
          </span>
        </GlitchText>

        <p className="mt-2 text-sm leading-relaxed text-spider-white/60">
          {post.excerpt}
        </p>

        <div className="mt-4 flex flex-wrap gap-1.5">
          {post.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-sm border border-spider-red/30 bg-spider-red/10 px-2 py-0.5 text-xs text-spider-red"
            >
              {tag}
            </span>
          ))}
        </div>
      </ComicPanel>
    </Link>
  );
}
