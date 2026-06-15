import React from 'react';
import Head from 'next/head';
import CourseLayout from '@/components/layout/CourseLayout';

export default function CompositionComprehensive() {
  const data = {
    title: "The heART of - Music Composition",
    mentor: "Sandesh Shandilya",
    mentorRole: "Acclaimed Film Composer & Music Director",
    mentorImage: "/assets/academy/sandesh.jpg",
    heroImage: "/assets/academy/sandesh.jpg",
    credentials: ["Acclaimed Music Composer", "30+ Years Experience", "7Bn+ Streams"],
    overview: [
      "Dive deeper into advanced composition techniques with this comprehensive 6-month course designed for those who have mastered the fundamentals. This course takes your compositional skills to the next level through intensive live sessions, comprehensive recorded content, and a unique training approach where knowledge meets experience.",
      "Learn directly from Sandesh Shandilya through 3 exclusive live interactive sessions where you'll receive personalized feedback, refine your craft, and explore advanced compositional concepts. With 200+ minutes of recorded content, 6 Months access to course contents, lifetime access to community, and direct mentorship, this course is designed to transform you into a confident and skilled composer."
    ],
    highlights: [
      { icon: "⏱️", title: "6 Months Duration", desc: "Comprehensive 6-month program designed for deep learning" },
      { icon: "📹", title: "200+ Mins Recorded", desc: "Extensive content covering advanced techniques" },
      { icon: "👥", title: "3 Live Sessions", desc: "Multiple live sessions for personalized guidance" },
      { icon: "📚", title: "6 Months Access", desc: "Full access to all course materials and recordings" },
      { icon: "🤝", title: "Lifetime Community", desc: "Join and stay connected with a vibrant community forever" },
      { icon: "🎓", title: "EWS Scholarships", desc: "Scholarships available for economically weaker sections" },
      { icon: "✨", title: "Unique Approach", desc: "Combines traditional learning with innovative techniques" },
      { icon: "🌟", title: "Knowledge & Experience", desc: "Learn from decades of proven compositional mastery" }
    ],
    learnings: [
      { title: "The Art Of Imagination", desc: "Learn how to play with your imagination and get into the correct zone." },
      { title: "Emotion To Expression", desc: "Takes you on an inner journey of feeling emotions and converting them into art." },
      { title: "Subconscious Mind", desc: "Creation happens in the subconscious. Learn to activate it naturally." },
      { title: "Mainstream Mastery", desc: "Create music that connects with the masses while staying creative." }
    ],
    curriculum: [
      {
        title: "Chapter 0 — It all Starts Here",
        desc: "Introduction to the fundamental concepts of music composition.",
        icon: "📚",
        segments: [
          { number: "0A", name: "The heART of Music Composition", assignment: true },
          { number: "0B", name: "Align Yourself" }
        ]
      },
      {
        title: "Chapter 1 — Introduction (Aamad)",
        desc: "Meet your mentor and understand the balance between emotion and technique.",
        icon: "🎯",
        segments: [
          { number: "1A", name: "Mentor & Course Introduction" },
          { number: "1B", name: "Aamad", assignment: true },
          { number: "1C", name: "Bhaav & Technique", assignment: true },
          { number: "1D", name: "Left Brain & Right Brain", assignment: true },
          { number: "1E", name: "Intellect & Love", assignment: true }
        ]
      },
      {
        title: "Chapter 2 — Bhaav / Emotions",
        desc: "Explore how emotions drive composition through real song examples.",
        icon: "💭",
        segments: [
          { number: "2A", name: "Song Examples", assignment: true }
        ]
      },
      {
        title: "Chapter 3 — Learning from Nature",
        desc: "Discover how nature teaches patterns, unpredictability, and emotion.",
        icon: "🌿",
        segments: [
          { number: "3A", name: "Self Doubt", assignment: true },
          { number: "3B", name: "Pattern", assignment: true },
          { number: "3C", name: "Flight of Emotions", assignment: true },
          { number: "3D", name: "Unpredictability", assignment: true }
        ]
      },
      {
        title: "Chapter 4 — Samarpan",
        desc: "Learn selfless composition - music that serves your audience.",
        icon: "🙏",
        segments: [
          { number: "4A", name: "Introduction", assignment: true },
          { number: "4B", name: "Artists & Inspiration", assignment: true },
          { number: "4C", name: "Example", assignment: true },
          { number: "4D", name: "Compassion", assignment: true }
        ]
      },
      {
        title: "Chapter 5 — Subconscious Mind",
        desc: "Tap into where true creation happens. Connect with your inner child.",
        icon: "🧠",
        segments: [
          { number: "5A", name: "Introduction", assignment: true },
          { number: "5B", name: "Being Fearless", assignment: true },
          { number: "5C", name: "Example", assignment: true },
          { number: "5D", name: "Be One With Your Instrument", assignment: true }
        ]
      },
      {
        title: "Chapter 6 — Composing with Artists",
        desc: "Master the art of collaborative composition and melody refinement.",
        icon: "🎤",
        segments: [
          { number: "6A", name: "Part 1" },
          { number: "6B", name: "Part 2", assignment: true }
        ]
      },
      {
        title: "Chapter 7 — Extension of the Basic Melody",
        desc: "Expand your melodic vocabulary exploring all 7 notes.",
        icon: "🎼",
        segments: [
          { number: "7A", name: "Exploring Composition with all 7 Notes", assignment: true }
        ]
      },
      {
        title: "Chapter 8 — Characteristics of A Good Composition",
        desc: "Essential elements: lyrics, motifs, and infinite possibilities.",
        icon: "⭐",
        segments: [
          { number: "8A", name: "Lyrics", assignment: true },
          { number: "8B", name: "Strong Musical Phrase & Unpredictability", assignment: true },
          { number: "8C", name: "Infinite Creation Possibilities", assignment: true },
          { number: "8D", name: "Inspiration", assignment: true },
          { number: "8E", name: "Words & Poetry", assignment: true }
        ]
      },
      {
        title: "Chapter 9 — Breath of Music",
        desc: "Discover how great compositions breathe with life and rhythm.",
        icon: "💨",
        segments: [
          { number: "9A", name: "Breath of Music", assignment: true }
        ]
      },
      {
        title: "Chapter 10 — Writing Melodies with Lyrics",
        desc: "Combine melodies with powerful poetry and memorable hook lines.",
        icon: "✍️",
        segments: [
          { number: "10A", name: "Introduction", assignment: true },
          { number: "10B", name: "Rhyming & Hook Lines", assignment: true }
        ]
      },
      {
        title: "Chapter 11 — Collaborations",
        desc: "Explore successful partnerships and the power of collaborative art.",
        icon: "🤝",
        segments: [
          { number: "11A", name: "Collaborations", assignment: true }
        ]
      },
      {
        title: "Chapter 12 — Composing a Song together",
        desc: "Practical techniques for jamming and collective creation.",
        icon: "🎵",
        segments: [
          { number: "12A", name: "Introduction", assignment: true },
          { number: "12B", name: "A Collective Jam" },
          { number: "12C", name: "Extension of the Song", assignment: true }
        ]
      },
      {
        title: "Chapter 13 — Unfolding Artist Force",
        desc: "Final capstone project - create an original composition.",
        icon: "✨",
        segments: [
          { number: "13A", name: "Final Capstone Project", assignment: true }
        ]
      }
    ],
    enrollLink: "https://tscacademy.exlyapp.com/checkout/55bdc656-c92d-4812-a775-944d5becf544?dynamic_link=ad961260-1373-49a9-9307-241497380256",
    masterclassLink: "/masterclass/sandesh-shandilya",
    comparisonTable: {
      headers: ["Feature", "Accelerator"],
      rows: [
        ["Recorded content", "Yes"],
        ["Live sessions", "3 sessions"],
        ["Community", "Yes"],
        ["WhatsApp access", "Yes"],
        ["Assignment feedback", "Yes"],
        ["Access", "6 Months"]
      ],
      tierLinks: [
        "https://tscacademy.exlyapp.com/checkout/55bdc656-c92d-4812-a775-944d5becf544?dynamic_link=ad961260-1373-49a9-9307-241497380256"
      ]
    }
  };

  return (
    <>
      <Head>
        <title>The heART of Composition - Comprehensive | TSC Academy</title>
        <meta name="description" content="6-month composition course with Sandesh Shandilya." />
      </Head>
      <CourseLayout {...data} />
    </>
  );
}
