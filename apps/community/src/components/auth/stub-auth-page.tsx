import Link from 'next/link';
import { Button } from '@/components/ui/button';

type StubAuthPageProps = {
  mode: 'sign-in' | 'sign-up';
  productionFallback?: boolean;
};

export function StubAuthPage({ mode, productionFallback = false }: StubAuthPageProps) {
  const title = mode === 'sign-in' ? 'Sign in' : 'Join The Collective';
  const otherHref = mode === 'sign-in' ? '/sign-up' : '/sign-in';
  const otherLabel = mode === 'sign-in' ? 'Create account' : 'Sign in';

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center bg-brand-cream-wash px-4 py-12">
      <div className="w-full max-w-md space-y-4 rounded-xl border border-brand-teal-deep/10 bg-brand-cream-wash/90 p-8 text-center shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-green">
          The Shakti Collective
        </p>
        <h1 className="font-display text-2xl font-light text-brand-teal-deep">{title}</h1>
        <p className="text-sm text-brand-teal-deep/70">
          {productionFallback
            ? 'Member sign-in is being finalized for production. Browse opportunities and explore the collective while we finish auth cutover.'
            : 'Clerk is disabled in local stub mode. Set real Clerk keys or disable TSC_AUTH_STUB to use hosted auth.'}
        </p>
        {!productionFallback ? (
          <Button asChild className="w-full bg-brand-green hover:bg-brand-teal-mid">
            <Link href="/feed">Continue as stub user</Link>
          </Button>
        ) : (
          <Button asChild className="w-full bg-brand-green hover:bg-brand-teal-mid">
            <Link href="/opportunities">Explore opportunities</Link>
          </Button>
        )}
        <Button asChild variant="ghost" className="w-full text-brand-teal-deep">
          <Link href={otherHref}>{otherLabel}</Link>
        </Button>
      </div>
    </div>
  );
}
