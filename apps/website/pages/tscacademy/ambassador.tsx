import React from 'react';
import Head from 'next/head';
import AmbassadorProgram from '@/components/sections/academy/AmbassadorProgram';

const AMBASSADOR_REGISTER_URL =
  'https://tscacademy.exlyapp.com/affiliate/onboarding/login';

export default function AmbassadorPage() {
  return (
    <>
      <Head>
        <title>TSC Academy Ambassador Program | Become an Ambassador</title>
        <meta
          name="description"
          content="Join the TSC Academy Ambassador Program. Earn ₹500 cashback per referral, give artists ₹500 off, and help grow India's independent music community."
        />
        <meta property="og:title" content="TSC Academy Ambassador Program" />
        <meta
          property="og:description"
          content="Learn from the best. Earn through referrals. Give back to the artist community."
        />
      </Head>
      <AmbassadorProgram registerUrl={AMBASSADOR_REGISTER_URL} />
    </>
  );
}
