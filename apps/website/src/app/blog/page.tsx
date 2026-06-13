import Link from 'next/link';
import { blogPosts } from '@/content/blog/posts';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { createPageMetadata } from '@/lib/seo/metadata';

export const metadata = createPageMetadata({
  title: 'Blog',
  description: 'Updates and essays from The Shakti Collective team.',
  path: '/blog',
});

export default function BlogIndexPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <div className="mb-10 space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">Blog</h1>
        <p className="text-muted-foreground">Notes on community, events, and platform building.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {blogPosts.map((post) => (
          <Link key={post.slug} href={`/blog/${post.slug}`}>
            <Card className="h-full transition-colors hover:border-primary/40">
              <CardHeader>
                <CardTitle className="text-lg">{post.title}</CardTitle>
                <CardDescription>{post.excerpt}</CardDescription>
                <p className="text-xs text-muted-foreground">
                  {new Date(post.publishedAt).toLocaleDateString()} · {post.readingMinutes} min read
                </p>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
