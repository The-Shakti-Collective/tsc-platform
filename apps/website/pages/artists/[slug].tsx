import React from 'react';
import Head from 'next/head';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { MapPin } from 'lucide-react';
import Section from '@/components/layout/Section';
import Container from '@/components/layout/Container';
import UnfoldReveal from '@/components/animations/UnfoldReveal';
import { Button } from '@/components/buttons/Button';
import { FishyButton } from '@/components/ui/fishy-button';
import { cms } from '@/lib/cms';

interface ArtistDetailPageProps {
  artist: ReturnType<typeof cms.getArtistBySlug>;
}

export default function ArtistDetailPage({ artist }: ArtistDetailPageProps) {
  if (!artist) {
    return (
      <>
        <Head>
          <title>Artist Not Found - TSC</title>
        </Head>
        <Section background="cream" padding="xl" className="min-h-[60vh] flex items-center justify-center">
          <Container className="text-center">
            <h1 className="text-5xl font-bold text-charcoal mb-6">Artist Not Found</h1>
            <p className="text-xl text-slate-medium mb-8">The artist profile you're looking for doesn't exist.</p>
          </Container>
        </Section>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>{artist.name} - TSC</title>
        <meta name="description" content={artist.bioShort} />
        <meta property="og:title" content={artist.name} />
        <meta property="og:description" content={artist.bioShort} />
        <meta property="og:image" content={artist.image} />
        <meta property="og:type" content="profile" />
        <meta name="twitter:card" content="summary_large_image" />
      </Head>

      {/* Hero */}
      <Section background="cream" padding="xl" className="min-h-[70vh] flex items-center justify-center">
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <UnfoldReveal variant="slideInLeft">
              <h1 className="text-6xl md:text-7xl font-bold text-charcoal mb-6">{artist.name}</h1>
              <div className="flex flex-wrap gap-3 mb-8">
                {artist.roles.map((role, index) => (
                  <span key={index} className="px-4 py-2 bg-orange text-cream rounded-full text-sm font-semibold">
                    {role}
                  </span>
                ))}
              </div>
              <p className="text-xl text-slate-medium mb-4 flex items-center">
                <MapPin size={20} className="text-orange mr-2" /> {artist.location}
              </p>
              <p className="text-lg text-slate-medium mb-8 leading-relaxed">{artist.bioShort}</p>
              {artist.bookingEnabled && (
                <Link href={`/contact?artist=${artist.slug}`}>
                  <Button variant="primary" size="lg">
                    Booking & Collaborations
                  </Button>
                </Link>
              )}
            </UnfoldReveal>

            <UnfoldReveal variant="slideInRight">
              <div className="rounded-lg overflow-hidden bg-cream">
                <img
                  src={artist.image}
                  alt={artist.name}
                  className="w-full h-full object-cover aspect-square"
                />
              </div>
            </UnfoldReveal>
          </div>
        </Container>
      </Section>

      {/* Bio & About */}
      <Section background="white" padding="xl">
        <Container>
          <div className="max-w-3xl mx-auto">
            <UnfoldReveal variant="fadeUp">
              <h2 className="text-4xl font-bold text-charcoal mb-6">About {artist.name}</h2>
              <div className="prose prose-lg max-w-none">
                <p className="text-lg text-slate-medium leading-relaxed mb-6">{artist.bioLong}</p>
              </div>
            </UnfoldReveal>
          </div>
        </Container>
      </Section>

      {/* Genres */}
      <Section background="cream-dark" padding="xl">
        <Container>
          <UnfoldReveal variant="fadeUp" className="mb-12">
            <h3 className="text-3xl font-bold text-charcoal mb-8">Creative Disciplines</h3>
            <div className="flex flex-wrap gap-4">
              {artist.genres.map((genre, index) => (
                <motion.div
                  key={index}
                  className="px-6 py-3 bg-white rounded-lg border-2 border-orange"
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <p className="font-semibold text-charcoal">{genre}</p>
                </motion.div>
              ))}
            </div>
          </UnfoldReveal>
        </Container>
      </Section>

      {/* Social Links */}
      {artist.social && (artist.social.instagram || artist.social.spotify) && (
        <Section background="white" padding="xl">
          <Container className="text-center">
            <UnfoldReveal variant="fadeUp">
              <h3 className="text-2xl font-bold text-charcoal mb-8">Follow & Listen</h3>
              <div className="flex justify-center gap-6 flex-wrap">
                {artist.social.instagram && (
                  <FishyButton
                    onClick={() => window.open(artist.social?.instagram, '_blank')}
                    variant="pumpkin"
                    width="140px"
                    height="56px"
                  >
                    Instagram
                  </FishyButton>
                )}
                {artist.social?.spotify && (
                  <FishyButton
                    onClick={() => window.open(artist.social?.spotify, '_blank')}
                    variant="pumpkin"
                    width="140px"
                    height="56px"
                  >
                    Spotify
                  </FishyButton>
                )}
              </div>
            </UnfoldReveal>
          </Container>
        </Section>
      )}

      {/* Booking CTA */}
      {artist.bookingEnabled && (
        <Section background="charcoal" padding="xl">
          <Container className="text-center">
            <UnfoldReveal variant="fadeUp" className="text-white">
              <h2 className="text-4xl md:text-5xl font-bold mb-6">Ready to Collaborate?</h2>
              <p className="text-xl text-cream mb-8 max-w-2xl mx-auto">
                Get in touch to discuss collaborations, bookings, and creative opportunities with {artist.name}.
              </p>
              <Link href={`/contact?artist=${artist.slug}`}>
                <Button variant="primary" size="lg" className="bg-cream text-orange hover:bg-cream-dark border-none">
                  Start a Conversation
                </Button>
              </Link>
            </UnfoldReveal>
          </Container>
        </Section>
      )}
    </>
  );
}

export async function getStaticProps({ params }: { params: { slug: string } }) {
  const artist = cms.getArtistBySlug(params.slug);

  if (!artist) {
    return {
      notFound: true,
    };
  }

  return {
    props: {
      artist,
    },
    revalidate: 60,
  };
}

export async function getStaticPaths() {
  const artists = cms.getArtists();

  return {
    paths: artists.map((artist) => ({
      params: {
        slug: artist.slug,
      },
    })),
    fallback: 'blocking',
  };
}
