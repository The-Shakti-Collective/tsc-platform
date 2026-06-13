import { notFound } from 'next/navigation';
import { blogPosts, getBlogPost } from '@/content/blog/posts';
import { createPageMetadata } from '@/lib/seo/metadata';

type BlogPostPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return blogPosts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) return {};

  return createPageMetadata({
    title: post.title,
    description: post.excerpt,
    path: `/blog/${post.slug}`,
  });
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) notFound();

  return (
    <article className="mx-auto max-w-3xl px-4 py-16">
      <p className="text-sm text-muted-foreground">
        {new Date(post.publishedAt).toLocaleDateString()} · {post.readingMinutes} min read
      </p>
      <h1 className="mt-2 text-4xl font-bold tracking-tight">{post.title}</h1>
      <div className="mt-8 space-y-4 text-muted-foreground">
        {post.body.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>
    </article>
  );
}
