'use client'

import Image from "next/legacy/image"
import { useState } from 'react'

const projects = [
  {
    id: 1,
    title: 'Mahavatar Narsimha',
    category: 'Business Strategy / Core Marketing / Non-Theatrical Business Monetization',
    image: '/assets/Movie_images_117.jpg',
    colSpan: 'lg:col-span-2',
    height: 'h-[300px]', // Taller for the main project
    description:
      'The journey of Mahavatar Narsimha has been nothing short of a divine orchestration. From building the campaign from the ground up—aligning music rights, shaping ideas, and jamming with the team of Kleem Productions—to witnessing everything unfold seamlessly, it was clear that this was never just our doing. With each step, we realized that Narsimha Dev Himself was leading the way, and we were merely the chosen ones entrusted with carrying out His vision.This project is a testament to what happens when purpose, spirit, and devotion come together. The incredible values, dedication, and unshakable spirit of the HOMBALE team have been the driving force behind presenting this film with authenticity and heart. What began as an idea has blossomed into an offering—a creation born out of faith, teamwork, and blessings, now ready to reach the world.In doing so, Mahavatar Narsimha not only changed the landscape of animated movies in India but also wreaked havoc at the box office, going on to become the highest-earning animated film of all time in the country.',
  },
  {
    id: 2,
    title: 'TSC Academy',
    category: 'Artist Development',
    image: '/assets/tsc academy.png',
    colSpan: 'lg:col-span-1',
    height: 'h-80',
    description:
      'Unfold yourself—from within to the world. Our academy isn\'t a conventional music school. It\'s a sanctuary where artists reclaim their voice, unlearn conformity, and discover the stories only they can tell. We nurture the quiet dreamers, the ones the industry overlooked.',
  },
  {
    id: 4,
    title: 'Main Bhi Artist',
    category: 'Community & Activism',
    image: '/assets/mba banner.png',
    colSpan: 'lg:col-span-1',
    height: 'h-80',
    description:
      'A rebellion dressed as community. Main Bhi Artist emerged because genuine artists were being crushed by gatekeepers. We created a home for the quiet music dreamers—a space where belonging comes before hustle, where collaboration thrives over competition. Every member here is proof that there\'s an alternative to the broken system.',
  },
  {
    id: 3,
    title: 'Artiste First',
    category: 'Strategic Partnerships',
    image: '/assets/image.png',
    colSpan: 'lg:col-span-2',
    height: 'h-80',
    description:
      'We believe artists shouldn\'t have to choose between integrity and opportunity. Artiste First is our commitment to that belief—consulting with creators on strategy, partnerships, and positioning without compromising their soul. From audio production to video direction to brand collaboration, we ensure the artist\'s voice remains sovereign.',
  },
]

const TRUNCATE_LENGTH = 100

export default function Projects() {
  const [expandedProjectId, setExpandedProjectId] = useState(null)

  const handleToggleDescription = (projectId) => {
    setExpandedProjectId((currentId) => (currentId === projectId ? null : projectId))
  }

  return (
    <section id="projects" className="py-20 px-6 bg-sea-foam dark:bg-peacock">
      <div className="container mx-auto">
        <div className="text-center mb-12">
          <h2 className="heading-font text-4xl font-bold text-white dark:text-cream">Our Work, Our Purpose</h2>
          <p className="text-lead text-white/80 dark:text-cream/80 mt-2">Projects that shaped culture and built community.</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {projects.map((project) => {
            const isExpanded = expandedProjectId === project.id
            const showToggleButton = project.description.length > TRUNCATE_LENGTH

            return (
              <div key={project.id} className={`bg-deep-teal dark:bg-chestnut rounded-lg shadow-md overflow-hidden group ${project.colSpan}`}>
                <div className={`relative w-full ${project.height}`}>
                  <Image src={project.image} alt={`Thumbnail for ${project.title}`} layout="fill" objectFit="cover" className="transition-transform duration-300 group-hover:scale-105" />
                </div>
                <div className="p-6 flex flex-col">
                  <p className="text-sm font-semibold text-pumpkin dark:text-pumpkin">{project.category}</p>
                  <h3 className="text-xl font-bold mt-1 text-cream dark:text-cream">{project.title}</h3>
                  <p className="text-cream/80 dark:text-cream/80 mt-2 text-sm flex-grow">
                    {showToggleButton && !isExpanded ? `${project.description.substring(0, TRUNCATE_LENGTH)}...` : project.description}
                  </p>
                  {showToggleButton && (
                    <button onClick={() => handleToggleDescription(project.id)} className="text-pumpkin hover:text-pumpkin/80 dark:text-pumpkin dark:hover:text-pumpkin/80 text-sm font-semibold mt-4 self-start">
                      {isExpanded ? 'Show Less' : 'Show More'}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}