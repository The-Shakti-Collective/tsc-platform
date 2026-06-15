import { ScaffoldPage } from '@/components/layout/scaffold-page';

export default function DirectoryPage() {
  return (
    <ScaffoldPage
      title="Directory"
      headline="Search Creatives"
      sections={[
        {
          title: 'Filter by',
          items: ['Role', 'Location', 'Skill', 'Experience', 'Availability', 'Industry'],
        },
        {
          title: 'Member Card',
          items: [
            'Photo',
            'Role',
            'City',
            'Top Skills',
            'Reputation Score',
            'Availability',
          ],
        },
      ]}
      cta={{ label: 'Browse artists', href: '/artists' }}
    />
  );
}
