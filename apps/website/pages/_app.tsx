import React from 'react';
import type { AppProps } from 'next/app';
import Head from 'next/head';
import Header from '@/components/layout/Header';
import AcademyHeader from '@/components/layout/AcademyHeader';
import { Footer } from '@/components/layout/Footer';
import '@/src/index.css';

import { useRouter } from 'next/router';

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const isReviewPage = router.pathname === '/classicalreview' || router.pathname === '/masterclass-review01' || router.pathname === '/masterclass-review02';
  
  const isAcademyPage = router.pathname.startsWith('/tscacademy') || 
                        router.pathname.startsWith('/masterclass/') || 
                        router.pathname.startsWith('/courses/');

  const isArtistPath = router.pathname === '/artist-path' || router.pathname === '/query';
  const isSuccess = router.query.success === 'true';
  const hideNavbar = isReviewPage;
  const hideFooter = (isArtistPath && !isSuccess) || isReviewPage;

  return (
    <>
      <Head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#000000" />
        <link rel="icon" href="/assets/favicon.png" />
        <link rel="apple-touch-icon" href="/assets/favicon.png" />
        <title>The Shakti Collective</title>
        <meta name="description" content="A global ecosystem for emerging artists and brands to co-create cultural IP." />
        <meta property="og:title" content="The Shakti Collective" />
        <meta property="og:description" content="A global ecosystem for emerging artists and brands to co-create cultural IP." />
        <meta property="og:image" content="https://theshakticollective.in/assets/banner.jpg" />
        <meta property="og:url" content="https://theshakticollective.in" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="The Shakti Collective" />
        <meta name="twitter:description" content="A global ecosystem for emerging artists and brands to co-create cultural IP." />
        <meta name="twitter:image" content="https://theshakticollective.in/assets/banner.jpg" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              "@id": "https://theshakticollective.in/#organization",
              "name": "The Shakti Collective",
              "url": "https://theshakticollective.in",
              "logo": "https://theshakticollective.in/assets/logo.png",
              "description": "A global ecosystem for emerging artists and brands to co-create cultural IP.",
              "sameAs": [
                "https://www.linkedin.com/company/theshakticollective",
                "https://www.instagram.com/theshakticollective"
              ],
              "contactPoint": {
                "@type": "ContactPoint",
                "contactType": "customer support",
                "email": "hello@theshakticollective.in"
              }
            })
          }}
        />
      </Head>

      <div className={`min-h-screen flex flex-col ${isReviewPage ? 'bg-[#050505]' : 'bg-cream'}`}>
        {!hideNavbar && (
          isAcademyPage ? <AcademyHeader /> : <Header />
        )}

        <main className="flex-1">
          <Component {...pageProps} />
        </main>

        {!hideFooter && <Footer />}
      </div>
    </>
  );
}
