import { ScaffoldPage } from '@/components/layout/scaffold-page';

export default function EventsPage() {
  return (
    <ScaffoldPage
      title="Events"
      sections={[
        {
          title: 'Featured Event',
          items: ['Large hero card — TSC Community Call, June 2026'],
        },
        {
          title: 'Event Categories',
          items: [
            'Workshops',
            'Masterclasses',
            'Networking',
            'Performances',
            'Industry Talks',
            'Showcases',
            'Auditions',
            'Hackathons',
          ],
        },
        {
          title: 'Event Detail',
          items: [
            'Agenda',
            'Speakers',
            'Venue',
            'Schedule',
            'Requirements',
            'Registration',
          ],
        },
      ]}
      cta={{ label: 'View featured event', href: '/events' }}
    />
  );
}
