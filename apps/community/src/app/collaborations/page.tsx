import { ScaffoldPage } from '@/components/layout/scaffold-page';

export default function CollaborationsPage() {
  return (
    <ScaffoldPage
      title="Collaborations"
      headline="Find people who can help bring your ideas to life."
      sections={[
        {
          title: 'Collaboration Types',
          items: [
            'Project Based',
            'Long Term',
            'Skill Exchange',
            'Mentorship',
            'Startup Ventures',
            'Creative Experiments',
          ],
        },
        {
          title: 'Matchmaking System',
          items: ['Skills', 'Location', 'Availability', 'Goals', 'Industry', 'Experience'],
        },
        {
          title: 'Collaboration Detail',
          items: [
            'Idea',
            'Objectives',
            'Required Roles',
            'Timeline',
            'Compensation',
            'Expected Outcomes',
          ],
        },
      ]}
    />
  );
}
