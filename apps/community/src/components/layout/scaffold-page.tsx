import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ScaffoldPageProps {
  title: string;
  headline?: string;
  sections?: { title: string; items: string[] }[];
  cta?: { label: string; href: string };
}

export function ScaffoldPage({ title, headline, sections, cta }: ScaffoldPageProps) {
  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-12">
      <div>
        <p className="text-sm uppercase tracking-[0.2em] text-brand-green">{title}</p>
        {headline ? (
          <h1 className="mt-2 font-display text-3xl font-light text-brand-teal-deep">{headline}</h1>
        ) : (
          <h1 className="mt-2 font-display text-3xl font-light text-brand-teal-deep">{title}</h1>
        )}
      </div>

      {sections?.map((section) => (
        <Card key={section.title} className="border-brand-teal-deep/10">
          <CardHeader>
            <CardTitle className="text-brand-teal-deep">{section.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-brand-teal-deep/80">
              {section.items.map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="text-brand-pumpkin">·</span>
                  {item}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ))}

      {cta ? (
        <Button asChild className="bg-brand-green hover:bg-brand-teal-mid">
          <Link href={cta.href}>{cta.label}</Link>
        </Button>
      ) : null}
    </div>
  );
}
