import React from 'react';
import Head from 'next/head';
import ArtistLinks from '@/components/artist/ArtistLinks';
import { FaInstagram, FaSpotify, FaYoutube, FaGlobe, FaCalendarAlt, FaMusic } from 'react-icons/fa';

/**
 * Harshad and Duhita - Links Page
 * A centralized hub for their social media, music, and bookings.
 * 
 * To create a new artist page:
 * 1. Copy this file to a new file in /pages/links/[artist-name].tsx
 * 2. Update the profile data and links below.
 */

const HarshadDuhitaLinks = () => {
  const artistData = {
    name: "Harshaduhita Collective",
    bio: "A live music duo blending deep-rooted Indian classical music with divine emotion and diverse musical expression.",
    avatarUrl: "/artists/harshadduhita/heroHND.jpeg",
    links: [
      {
        label: "Book a Query Call",
        url: "/query",
        icon: FaCalendarAlt,
        primary: true,
        highlight: true,
      },
      {
        label: "Listen on Spotify",
        url: "https://open.spotify.com/artist/6L88xirodmbWYoZuvseUnc?si=jT1v3lbeQUuC9UNuoVEHeQ",
        icon: FaSpotify,
        primary: false,
      },
      {
        label: "Gananayaka (Ganpati Song 2024)",
        url: "https://www.youtube.com/watch?v=IcknSFj2rys",
        icon: FaMusic,
        primary: false,
      },
      {
        label: "Watch on India's Got Talent",
        url: "https://www.youtube.com/watch?v=_PRy2jW7t0c",
        icon: FaYoutube,
        primary: false,
      },
      {
        label: "Official Website",
        url: "/harshadduhita",
        icon: FaGlobe,
        primary: false,
      },
    ],
    socials: {
      instagram: "https://www.instagram.com/harshaduhita_collective/",
      youtube: "https://www.youtube.com/watch?v=IcknSFj2rys",
      spotify: "https://open.spotify.com/artist/6L88xirodmbWYoZuvseUnc?si=jT1v3lbeQUuC9UNuoVEHeQ",
      website: "/",
    }
  };

  return (
    <>
      <Head>
        <title>{artistData.name} | Links | The Shakti Collective</title>
        <meta name="description" content={`Connect with ${artistData.name}. All social media, music, and contact links in one place.`} />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />

        {/* Open Graph / SEO */}
        <meta property="og:title" content={`${artistData.name} | Links`} />
        <meta property="og:description" content={`Connect with ${artistData.name}. Music, Socials, and Booking.`} />
        <meta property="og:image" content={artistData.avatarUrl} />
        <meta name="twitter:card" content="summary_large_image" />
      </Head>

      <ArtistLinks {...artistData} />
    </>
  );
};

export default HarshadDuhitaLinks;
