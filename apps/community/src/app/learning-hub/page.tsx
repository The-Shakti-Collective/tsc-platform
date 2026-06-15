import { ScaffoldPage } from '@/components/layout/scaffold-page';

export default function LearningHubPage() {
  return (
    <ScaffoldPage
      title="Learning Hub"
      headline="Learn from creators who have done the work."
      sections={[
        {
          title: 'Categories',
          items: [
            'Music',
            'Film',
            'Photography',
            'Design',
            'Business',
            'Marketing',
            'AI',
            'Personal Branding',
            'Creative Entrepreneurship',
          ],
        },
        {
          title: 'Content Types',
          items: [
            'Courses',
            'Playbooks',
            'Templates',
            'Checklists',
            'Toolkits',
            'Case Studies',
            'Interviews',
          ],
        },
      ]}
    />
  );
}
