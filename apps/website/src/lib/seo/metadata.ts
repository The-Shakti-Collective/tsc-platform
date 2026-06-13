import type { Metadata } from 'next';
import { siteConfig } from '@/lib/config/site';

type PageMetaInput = {
  title?: string;
  description?: string;
  path?: string;
  noIndex?: boolean;
};

export function createPageMetadata({
  title,
  description = siteConfig.description,
  path = '',
  noIndex = false,
}: PageMetaInput = {}): Metadata {
  const pageTitle = title ? `${title} | ${siteConfig.name}` : siteConfig.name;
  const canonical = new URL(path, siteConfig.url).toString();

  return {
    title: pageTitle,
    description,
    keywords: [...siteConfig.keywords],
    metadataBase: new URL(siteConfig.url),
    alternates: { canonical },
    openGraph: {
      type: 'website',
      locale: siteConfig.locale,
      url: canonical,
      siteName: siteConfig.name,
      title: pageTitle,
      description,
    },
    twitter: {
      card: 'summary_large_image',
      title: pageTitle,
      description,
      site: siteConfig.twitterHandle,
    },
    robots: noIndex ? { index: false, follow: false } : { index: true, follow: true },
  };
}
