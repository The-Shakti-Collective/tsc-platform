import { ScaffoldPage } from '@/components/layout/scaffold-page';

export default function AboutPage() {
  return (
    <ScaffoldPage
      title="About The Collective"
      headline="Build sustainable creative careers."
      sections={[
        {
          title: 'Mission',
          items: ['Build sustainable creative careers.'],
        },
        {
          title: 'Vision',
          items: ['Create the most trusted creative ecosystem in India.'],
        },
        {
          title: 'Values',
          items: [
            'Generosity',
            'Excellence',
            'Collaboration',
            'Ownership',
            'Growth',
            'Authenticity',
          ],
        },
      ]}
      cta={{ label: 'Join The Shakti Collective', href: '/sign-up' }}
    />
  );
}
