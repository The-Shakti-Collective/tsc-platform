import { Award, FolderKanban, Handshake, ShieldCheck, Trophy, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type BadgeItem = {
  id: string;
  label: string;
  earned: boolean;
  icon: string;
};

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  handshake: Handshake,
  folder: FolderKanban,
  users: Users,
  badge: ShieldCheck,
  mentor: Award,
  trophy: Trophy,
};

export function BadgesPanel({ badges }: { badges: BadgeItem[] }) {
  const earned = badges.filter((b) => b.earned).length;

  return (
    <Card className="border-brand-teal-deep/10 bg-brand-pumpkin-soft/20">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-brand-teal-deep">
          <span className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-brand-pumpkin" />
            Status Badges
          </span>
          <span className="text-sm font-normal text-brand-teal-deep/60">
            {earned}/{badges.length} earned
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        {badges.map((badge) => {
          const Icon = iconMap[badge.icon] ?? Award;
          return (
            <Badge
              key={badge.id}
              variant={badge.earned ? 'default' : 'outline'}
              className={cn(
                'cursor-default gap-1 px-3 py-1.5',
                badge.earned
                  ? 'bg-brand-green text-brand-cream-wash'
                  : 'border-brand-teal-deep/15 text-brand-teal-deep/40',
              )}
            >
              <Icon className="h-3 w-3" />
              {badge.label}
            </Badge>
          );
        })}
      </CardContent>
    </Card>
  );
}
