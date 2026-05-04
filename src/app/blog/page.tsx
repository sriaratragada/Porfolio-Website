import { getAllPosts } from '@/lib/mdx';
import ComicGrid from '@/components/comic/ComicGrid';
import BlogCard from '@/components/blog/BlogCard';

export const metadata = {
  title: 'Blog | Spider-Verse Portfolio',
};

export default function BlogPage() {
  const posts = getAllPosts();

  return (
    <div className="section-container pt-32">
      <h1
        className="mb-12 text-center text-5xl tracking-wider text-spider-white md:text-6xl"
        style={{ fontFamily: 'var(--font-bangers)' }}
      >
        THE DAILY BUGLE
      </h1>

      {posts.length === 0 ? (
        <div className="comic-panel mx-auto max-w-md p-8 text-center">
          <p
            className="text-2xl text-spider-white/60"
            style={{ fontFamily: 'var(--font-bangers)' }}
          >
            No posts yet. Stay tuned!
          </p>
        </div>
      ) : (
        <ComicGrid layout="three-column">
          {posts.map((post, i) => (
            <BlogCard key={post.slug} post={post} index={i} />
          ))}
        </ComicGrid>
      )}
    </div>
  );
}
