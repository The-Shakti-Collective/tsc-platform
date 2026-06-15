import React from 'react';
import Head from 'next/head';
import ArtistLinks from '@/components/artist/ArtistLinks';
import { FaCalendarAlt, FaEnvelope, FaGlobe, FaInstagram, FaSpotify, FaYoutube } from 'react-icons/fa';

const YugmLinks = () => {
  const artistData = {
    name: 'Yugm',
    bio: 'Jaipur-based folk-fusion band bridging traditional roots with modern storytelling.',
    avatarUrl: '/artists/yugm/img-9616.jpg',
    links: [
      {
        label: 'Book a Query Call',
        url: '/query?artist=YUGM',
        icon: FaCalendarAlt,
        primary: true,
        highlight: true,
      },
      {
        label: 'Email Us',
        url: 'mailto:artist@theshakticollective.in',
        icon: FaEnvelope,
      },
      {
        label: 'Explore Yugm Profile',
        url: '/yugm',
        icon: FaGlobe,
      },
      // {
      //   label: 'Instagram',
      //   url: 'https://www.instagram.com/yugmofficial/',
      //   icon: FaInstagram,
      // },
      // {
      //   label: 'Spotify',
      //   url: 'https://open.spotify.com/artist/43uEANXUn0eOJrYKfjq2DL',
      //   icon: FaSpotify,
      // },
      // {
      //   label: 'YouTube',
      //   url: 'https://www.youtube.com/@yugmofficial5231',
      //   icon: FaYoutube,
      // },
    ],
    socials: {
      instagram: 'https://www.instagram.com/yugmofficial/',
      youtube: 'https://www.youtube.com/@yugmofficial5231',
      spotify: 'https://open.spotify.com/artist/43uEANXUn0eOJrYKfjq2DL',
      email: 'artist@theshakticollective.in',
      website: '/yugm',
    },
  };

  return (
    <>
      <Head>
        <title>Yugm | Link Hub | The Shakti Collective</title>
        <meta
          name="description"
          content="Connect with Yugm. Book calls, email the band, and explore their stage-ready folk fusion profile."
        />
        <meta property="og:title" content="Yugm | Link Hub" />
        <meta property="og:description" content="Connect with Yugm. Music, booking, and artist profile in one place." />
        <meta property="og:image" content={artistData.avatarUrl} />
        <meta name="twitter:card" content="summary_large_image" />
      </Head>

      <ArtistLinks {...artistData} />
    </>
  );
};

export default YugmLinks;
