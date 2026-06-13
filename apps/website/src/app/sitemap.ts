import type { MetadataRoute } from 'next';
import { blogPosts } from '@/content/blog/posts';
import { siteConfig } from '@/lib/config/site';

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = ['', '/programs', '/discover', '/blog', '/about', '/contact'].map((path) => ({
    url: `${siteConfig.url}${path}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: path === '' ? 1 : 0.7,
  }));

  const blogRoutes = blogPosts.map((post) => ({
    url: `${siteConfig.url}/blog/${post.slug}`,
    lastModified: new Date(post.publishedAt),
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }));

  return [...staticRoutes, ...blogRoutes];
}
