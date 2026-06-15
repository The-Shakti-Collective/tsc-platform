import { ScaffoldPage } from '@/components/layout/scaffold-page';

export default function ProjectsHubPage() {
  return (
    <ScaffoldPage
      title="Projects Hub"
      sections={[
        {
          title: 'Create Project',
          items: ['Title', 'Description', 'Goal', 'Budget', 'Timeline', 'Required Roles'],
        },
        {
          title: 'Project Workspace',
          items: [
            'Overview',
            'Team',
            'Tasks',
            'Files',
            'Discussions',
            'Timeline',
            'Deliverables',
          ],
        },
      ]}
      cta={{ label: 'View collaborations', href: '/collaborations' }}
    />
  );
}
