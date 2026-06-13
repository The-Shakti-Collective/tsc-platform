import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <div className="mx-auto flex min-h-[50vh] max-w-lg items-center justify-center px-4 py-12">
      <SignIn routing="path" path="/sign-in" signUpUrl="/sign-up" />
    </div>
  );
}
