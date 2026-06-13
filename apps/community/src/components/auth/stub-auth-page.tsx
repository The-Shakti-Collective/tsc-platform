import Link from 'next/link';
import { Button } from '@/components/ui/button';

type StubAuthPageProps = {
  mode: 'sign-in' | 'sign-up';
};

export function StubAuthPage({ mode }: StubAuthPageProps) {
  const title = mode === 'sign-in' ? 'Sign in (stub)' : 'Join (stub)';
  const otherHref = mode === 'sign-in' ? '/sign-up' : '/sign-in';
  const otherLabel = mode === 'sign-in' ? 'Create account' : 'Sign in';

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-4 rounded-lg border bg-card p-6 text-center shadow-sm">
        <h1 className="text-xl font-semibold">{title}</h1>
        <p className="text-sm text-muted-foreground">
          Clerk is disabled in local stub mode. Set real Clerk keys or disable{' '}
          <code className="rounded bg-muted px-1">TSC_AUTH_STUB</code> to use hosted auth.
        </p>
        <Button asChild className="w-full">
          <Link href="/feed">Continue as stub user</Link>
        </Button>
        <Button asChild variant="ghost" className="w-full">
          <Link href={otherHref}>{otherLabel}</Link>
        </Button>
      </div>
    </div>
  );
}
