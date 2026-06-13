import { SignIn } from '@clerk/clerk-react';



export default function SignInPage() {

  return (

    <main className="mx-auto flex max-w-md justify-center px-4 py-16">

      <SignIn routing="path" path="/sign-in" signUpUrl="/sign-in" afterSignInUrl="/workspace" />

    </main>

  );

}

