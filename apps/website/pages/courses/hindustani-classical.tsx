import React from 'react';
import Head from 'next/head';
import CourseLayout from '@/components/layout/CourseLayout';

export default function HindustaniClassical() {
  const data = {
    title: "The Roots of - Hindustani Classical",
    mentor: "Pandit Prasad Khaparde",
    mentorRole: "Legendary Classical Vocalist",
    mentorImage: "/assets/academy/prasadji.jpg",
    heroImage: "/assets/academy/prasadji.jpg",
    credentials: ["Legendary Classical Vocalist", "30+ Years Experience", "Rampur Sahaswan Gharana Master"],
    overview: [
      "Immerse yourself in the timeless art of Hindustani classical singing with this comprehensive learning program designed for aspiring vocalists of all levels. Learn the sacred nuances, raag structures, and vocal techniques that form the foundation of classical Indian music. This learning program takes you on a deep journey through one of the world's oldest musical traditions.",
      "Learn directly from Pandit Prasad Khaparde, a legendary Hindustani classical vocalist with over 30 years of experience, trained in the prestigious Rampur Sahaswan gharana under Padma Bhushan Ustad Rashid Khan. Through 3+ exclusive live group sessions where you'll receive personalized feedback and guidance, 120+ minutes of recorded content, quality assessments, and certification, this learning program is designed to develop your classical singing abilities."
    ],
    highlights: [
      { icon: "⏱️", title: "Comprehensive Program", desc: "Structured program for deep learning and skill development" },
      { icon: "📹", title: "120+ Mins Recorded", desc: "Extensive modules covering raagas, vocal techniques, and traditions" },
      { icon: "👥", title: "3+ Live Sessions", desc: "Live group sessions for personalized guidance and feedback" },
      { icon: "🎤", title: "Raag Training", desc: "Master the fundamental and advanced raags central to the art" },
      { icon: "📚", title: "Quality Assessments", desc: "Regular assessments to track progress and identify improvements" },
      { icon: "🏆", title: "Certification", desc: "Official certification recognized in the classical music community" },
      { icon: "🎵", title: "Gharana Tradition", desc: "Learn the authentic Rampur Sahaswan gharana tradition" },
      { icon: "✨", title: "Lifetime Community", desc: "Stay connected with a vibrant community of enthusiasts forever" }
    ],
    learnings: [
      { title: "Foundations", desc: "Master concepts like swaras, raags, thaats, and taals." },
      { title: "Raag Exploration", desc: "Understand and interpret multiple raags and their characters." },
      { title: "Vocal Technique", desc: "Develop proper breathing and vocal discipline." },
      { title: "Gharana Tradition", desc: "Explore the rich heritage and history of musical traditions." }
    ],
    curriculum: [
      {
        title: "Chapter 0 — Introduction",
        desc: "Meet your mentor and understand the origin.",
        icon: "📚",
        segments: [
          { number: "00", name: "Mentor Introduction" },
          { number: "0A", name: "Blessings Of A Guru" },
          { number: "0B", name: "Introduction" },
          { number: "0C", name: "The Origin" }
        ]
      },
      {
        title: "Chapter 1 — What is Music?",
        desc: "Definition and fundamental concepts.",
        icon: "🎵",
        segments: [
          { number: "1A", name: "Definition" }
        ]
      },
      {
        title: "Chapter 2 — Hindustani classical and semi classical music",
        desc: "Distinctions and similarities between forms.",
        icon: "🎼",
        segments: [
          { number: "2A", name: "Definition" }
        ]
      },
      {
        title: "Chapter 3 — History of Classical Music",
        desc: "Tracing the evolution through gharanas.",
        icon: "🏛️",
        segments: [
          { number: "3A", name: "Introduction" },
          { number: "3B", name: "Gharana, Tradition" }
        ]
      },
      {
        title: "Chapter 4 — Swaar, Thaat, And Saptak",
        desc: "Mastering the building blocks.",
        icon: "🎹",
        segments: [
          { number: "4A", name: "Introduction" },
          { number: "4B", name: "Presentation & Notes Of Thaat" },
          { number: "4C", name: "Practicing Thaat" }
        ]
      },
      {
        title: "Chapter 5 — Introduction To Ragas",
        desc: "Deep dive into Yaman, Bhimpalasi, Madhuvanti, and Bhairav.",
        icon: "🎤",
        segments: [
          { number: "5A", name: "Puriya Dhanashree & Yaman" },
          { number: "5B", name: "Bhimpalasi" },
          { number: "5C", name: "Yaman & Yaman Kalyan" },
          { number: "5D", name: "Madhuvanti" },
          { number: "5E", name: "Bhairav" }
        ]
      },
      {
        title: "Chapter 6 — Listening Is Learning",
        desc: "Exploring the music of legends.",
        icon: "🎧",
        segments: [
          { number: "6A", name: "The music of legends" }
        ]
      },
      {
        title: "Chapter 7 — Select Your Perfect 'Sa'",
        desc: "Finding your tonic note.",
        icon: "🎙️",
        segments: [
          { number: "7A", name: "The Process" },
          { number: "7B", name: "Practice Of Notes" },
          { number: "7C", name: "Important Books" }
        ]
      },
      {
        title: "Chapter 8 — Kanth Saadhna",
        desc: "Vocal culture techniques for resonance.",
        icon: "✨",
        segments: [
          { number: "8A", name: "Throat, Chest & Navel" },
          { number: "8B", name: "Breathing Capacity" },
          { number: "8C", name: "Sustaining The Notes" }
        ]
      },
      {
        title: "Chapter 9 — Tanpura",
        desc: "Importance and tuning.",
        icon: "Violin",
        segments: [
          { number: "9A", name: "Importance Of Tanpura" },
          { number: "9B", name: "Tuning" }
        ]
      },
      {
        title: "Chapter 10 — Basic Phrases Of Ragas",
        desc: "Mastering core melodic structures.",
        icon: "🎼",
        segments: [
          { number: "10A", name: "Basic Phrase Practice Of Ragas" }
        ]
      },
      {
        title: "Chapter 11 — Basic Taal introduction",
        desc: "Rhythmic patterns.",
        icon: "🥁",
        segments: [
          { number: "11A", name: "Different Rhythm Patterns" }
        ]
      },
      {
        title: "Chapter 12 — Bandish",
        desc: "Bandish practice.",
        icon: "🖋️",
        segments: [
          { number: "12A", name: "Practice" }
        ]
      },
      {
        title: "Chapter 13 — Practice of Advance Ragas",
        desc: "Complex ragas and advanced techniques.",
        icon: "⭐",
        segments: [
          { number: "13A", name: "Part A" },
          { number: "13B", name: "Part B" },
          { number: "13C", name: "Part C" }
        ]
      },
      {
        title: "Chapter 14 — Unfolding Artist Force",
        desc: "Expressive mastery and personal growth.",
        icon: "🌟",
        segments: [
          { number: "14A", name: "Unfolding Artist Force" }
        ]
      }
    ],
    enrollLink: "https://tscacademy.exlyapp.com/checkout/245f8992-f7bd-41c2-aa48-864a1ac2b9cd?dynamic_link=bd0469b9-25d2-4056-8b4f-a78d4fe814da",
    masterclassLink: "/masterclass/prasad-khaparde",
    comparisonTable: {
      headers: ["Feature", "Accelerator"],
      rows: [
        ["Recorded content", "Yes"],
        ["Live sessions", "3+ Group Sessions"],
        ["Community", "Yes"],
        ["WhatsApp access", "Yes"],
        ["Assignment feedback", "Yes"],
        ["Access", "6 Months"]
      ],
      tierLinks: [
        "https://tscacademy.exlyapp.com/checkout/245f8992-f7bd-41c2-aa48-864a1ac2b9cd?dynamic_link=bd0469b9-25d2-4056-8b4f-a78d4fe814da"
      ]
    }
  };

  return (
    <>
      <Head>
        <title>The Roots of Hindustani Classical Music | TSC Academy</title>
        <meta name="description" content="Master Hindustani classical singing with Pandit Prasad Khaparde." />
      </Head>
      <CourseLayout {...data} />
    </>
  );
}
