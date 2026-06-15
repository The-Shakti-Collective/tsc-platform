import { ScaffoldPage } from '@/components/layout/scaffold-page';

const POST_TYPES = [
  'Project Update',
  'Opportunity',
  'Industry Insight',
  'Resource',
  'Case Study',
  'Ask For Help',
  'Collaboration Request',
  'Event Recap',
];

export default function FeedPage() {
  return (
    <ScaffoldPage
      title="Community Feed"
      headline="Value-first updates — not another social feed."
      sections={[
        {
          title: 'Post Types',
          items: POST_TYPES,
        },
        {
          title: 'Feed Ranking',
          items: ['Opportunity > Insight > Collaboration > General Post'],
        },
      ]}
      cta={{ label: 'Discover opportunities', href: '/opportunities' }}
    />
  );
}
