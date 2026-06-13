import Link from 'next/link';

type StubAuthPageProps = {
  mode: 'sign-in' | 'sign-up';
};

export function StubAuthPage({ mode }: StubAuthPageProps) {
  const title = mode === 'sign-in' ? 'Sign in (stub)' : 'Create account (stub)';
  const otherHref = mode === 'sign-in' ? '/sign-up' : '/sign-in';
  const otherLabel = mode === 'sign-in' ? 'Create account' : 'Sign in';

  return (
    <div className="mx-auto flex min-h-[50vh] max-w-lg items-center justify-center px-4 py-12">
      <div className="w-full space-y-4 rounded-lg border bg-card p-6 text-center shadow-sm">
        <h1 className="text-xl font-semibold">{title}</h1>
        <p className="text-sm text-muted-foreground">
          Clerk is disabled in local stub mode. Set real Clerk keys or disable stub flags for hosted auth.
        </p>
        <Link href="/" className="inline-flex text-sm font-medium text-primary hover:underline">
          Return home
        </Link>
        <Link href={otherHref} className="block text-sm text-muted-foreground hover:text-foreground">
          {otherLabel}
        </Link>
      </div>
    </div>
  );
}
