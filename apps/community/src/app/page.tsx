import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { LandingPage } from '@/components/landing/landing-page';
import { isClerkConfigured } from '@/lib/clerk-env';

export default async function HomePage() {
  if (isClerkConfigured()) {
    const { userId } = await auth();
    if (userId) {
      redirect('/dashboard');
    }
  }

  return <LandingPage />;
}
