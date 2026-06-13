import { FeedNav } from '@/components/layout/feed-nav';

export default function FeedLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      <FeedNav />
      {children}
    </div>
  );
}
