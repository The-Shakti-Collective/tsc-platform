import { AppShell } from '@/components/layout/app-shell';
import { SiteFooter } from '@/components/layout/site-footer';
import { SiteHeader } from '@/components/layout/site-header';
import { isMemberAppRoute } from '@/lib/member-routes';
import { resolveRequestPathname } from '@/lib/resolve-request-pathname';

type SiteChromeProps = {
  children: React.ReactNode;
};

export async function SiteChrome({ children }: SiteChromeProps) {
  const pathname = await resolveRequestPathname();

  if (isMemberAppRoute(pathname)) {
    return <AppShell>{children}</AppShell>;
  }

  return (
    <>
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </>
  );
}
