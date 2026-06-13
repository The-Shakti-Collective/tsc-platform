import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  return (
    <div className="mx-auto flex min-h-[50vh] max-w-lg items-center justify-center px-4 py-12">
      <SignUp routing="path" path="/sign-up" signInUrl="/sign-in" />
    </div>
  );
}
