import { notFound } from 'next/navigation';
import Link from 'next/link';
import { MDXRemote } from 'next-mdx-remote/rsc';
import { getPostBySlug, getAllSlugs } from '@/lib/mdx';
import ComicPanel from '@/components/comic/ComicPanel';

export async function generateStaticParams() {
  const slugs = getAllSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return { title: 'Not Found' };
  return { title: `${post.title} | Blog` };
}

const mdxComponents = {
  h1: (props: React.ComponentProps<'h1'>) => (
    <h1
      className="mb-6 text-4xl text-spider-white"
      style={{ fontFamily: 'var(--font-bangers)' }}
      {...props}
    />
  ),
  h2: (props: React.ComponentProps<'h2'>) => (
    <h2
      className="mb-4 mt-8 text-3xl text-spider-white"
      style={{ fontFamily: 'var(--font-bangers)' }}
      {...props}
    />
  ),
  h3: (props: React.ComponentProps<'h3'>) => (
    <h3
      className="mb-3 mt-6 text-2xl text-spider-red"
      style={{ fontFamily: 'var(--font-bangers)' }}
      {...props}
    />
  ),
  p: (props: React.ComponentProps<'p'>) => (
    <p className="mb-4 leading-relaxed text-spider-white/80" {...props} />
  ),
  a: (props: React.ComponentProps<'a'>) => (
    <a className="text-spider-blue underline hover:text-spider-red" {...props} />
  ),
  code: (props: React.ComponentProps<'code'>) => (
    <code
      className="rounded bg-spider-white/10 px-1.5 py-0.5 text-sm text-spider-red"
      {...props}
    />
  ),
  pre: (props: React.ComponentProps<'pre'>) => (
    <pre
      className="mb-4 overflow-x-auto rounded-sm border border-white/10 bg-black/50 p-4 text-sm"
      {...props}
    />
  ),
  ul: (props: React.ComponentProps<'ul'>) => (
    <ul className="mb-4 list-disc space-y-1 pl-6 text-spider-white/80" {...props} />
  ),
  ol: (props: React.ComponentProps<'ol'>) => (
    <ol className="mb-4 list-decimal space-y-1 pl-6 text-spider-white/80" {...props} />
  ),
  blockquote: (props: React.ComponentProps<'blockquote'>) => (
    <blockquote
      className="mb-4 border-l-4 border-spider-red pl-4 italic text-spider-white/60"
      {...props}
    />
  ),
};

export default async function BlogPost({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  return (
    <div className="section-container pt-32">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/blog"
          className="mb-8 inline-block text-sm uppercase tracking-widest text-spider-red hover:text-spider-white"
          style={{ fontFamily: 'var(--font-bangers)' }}
        >
          &larr; Back to Blog
        </Link>

        <ComicPanel variant="accent" className="mb-8">
          <div className="flex items-center gap-3 text-xs text-spider-white/40">
            <time>{post.date}</time>
            <span>&bull;</span>
            <span>{post.readingTime}</span>
          </div>
          <h1
            className="mt-2 text-4xl tracking-wider text-spider-white md:text-5xl"
            style={{ fontFamily: 'var(--font-bangers)' }}
          >
            {post.title}
          </h1>
          <div className="mt-4 flex flex-wrap gap-2">
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

        <ComicPanel className="prose-invert">
          <MDXRemote source={post.content} components={mdxComponents} />
        </ComicPanel>
      </div>
    </div>
  );
}
