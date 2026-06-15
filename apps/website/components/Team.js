import Image from "next/legacy/image"
import { FaLinkedin, FaTwitter, FaInstagram } from 'react-icons/fa'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const teamMembers = [
  {
    id: 1,
    name: 'Rohith Sobti',
    role: 'Curator and Co-founder',
    image: '/assets/rohit.png',
    description: <>Rohit Sobti is a <strong>visionary music and entertainment strategist</strong>, <strong>Co-Founder of The Shakti Collective</strong>, and a <strong>Harvard Business School (BEMS) and IIM Bangalore alumnus</strong>. With <strong>27+ years of experience</strong>, he has been at the forefront of <strong>creating and monetizing intellectual property</strong> across music, films, and brand ecosystems, architecting monetization strategies for catalogs totaling over XX streams.</>,
    philosophy: '"Through The Shakti Collective and Artiste First, he continues to build scalable IPs and sustainable music businesses where creativity and commerce thrive together."',
    accomplishments: [
      <>A former <strong>Vice President at Yash Raj Films</strong> and a leader at global giants like <strong>Sony Music and Universal Music India</strong>, Rohit brings a rare blend of Ivy League business strategy and deep creative intuition.</>,
      <>His expertise in <strong>Intellectual Property Rights (IPR)</strong> and non-theatrical monetization has made him a pivotal figure in taking Indian music to a global stage.</>,
      <>His career is defined by building sustainable foundations for the industry, from leading strategy for massive IPs like <strong>Mahavatar Narsimha</strong> to scaling the music labels of India’s most iconic artists, including Arijit Singh, Amit Trivedi, and Vishal Bhardwaj.</>,
      <>Today, Rohit is dedicated to professionalizing the <strong>creator economy</strong> and building new models of collaboration.</>
    ],
    socials: {
      linkedin: 'https://www.linkedin.com/in/rohitsobti/',
      instagram: 'https://www.instagram.com/rohitsobti1?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==',
    },
  },
  {
    id: 2,
    name: 'Sandesh Shandaliya',
    role: 'Music Composer and Co-founder',
    image: '/assets/sandesh.jpg',
    description: <>An acclaimed <strong>music director</strong>, recognised for <strong>50+ films, 30+ years in the Industry</strong>, a <strong>Filmfare nomination</strong> & <strong>7Bn+ streams</strong> across platforms. Creator of iconic songs like <strong>Aaoge Jab Tum, Piya Basanti</strong> & many more. Made generation-defining music with ace directors for multiple Bollywood Blockbusters.</>,
    accomplishments: [
      <>Iconic songs like <strong>"Piya Basanti"</strong>, <strong>"Aaoge Jab Tum"</strong>, <strong>"Suraj Hua Maddham"</strong>, and from the movie <strong>"Chameli"</strong>.</>,
      <>Recognised for <strong>50+ films</strong> and <strong>30+ years</strong> in the industry.</>,
      <>Garnered over <strong>7 billion streams</strong> across platforms.</>,
      <>Received a <strong>Filmfare nomination</strong> for his work.</>
    ],
    socials: {
      instagram: 'https://www.instagram.com/sandeshshandilya?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==',
    },
  },
  // {
  //   id: 4,
  //   name: 'Deepank Soni',
  //   role: 'G.O.A.T',
  //   image: '/assets/deepank.jpg',
  //   description: <>Deepank is the creative <strong>powerhouse</strong> behind The Shakti Collective's visual identity. With a keen eye for aesthetics and a deep understanding of <strong>cultural symbolism</strong>, he crafts visuals that <strong>resonate on a profound level</strong>. His work is not just about looking good; it's about telling stories that connect.</>,
  //   philosophy: '"Design is the silent ambassador of culture. It speaks when words fail."',
  //   accomplishments: [
  //     <>Expert in translating cultural narratives into compelling <strong>visual experiences</strong>.</>,
  //     <>Strategic marketing minds behind <strong>viral campaigns</strong> that sparked conversations.</>,
  //     <>Master of <strong>motion graphics</strong> that bridge art and commerce authentically.</>,
  //     <>Collaborative force in bringing ambitious <strong>creative visions</strong> to life.</>
  //   ],
  //   socials: {
  //     linkedin: 'https://www.linkedin.com/in/deepank-soni-bab014243/',
  //     instagram: 'https://www.instagram.com/deepank_soni_?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==',
  //   },
  // },
  // {
  //   id: 3,
  //   name: 'Laksh Maheshwari',
  //   role: 'Master Storyteller',
  //   image: '/assets/laksh.jpg',
  //   description: <>Laksh weaves narratives that <strong>stay with people</strong> long after they're told. He's the voice that captures what others feel but can't articulate—turning personal struggles into <strong>universal stories</strong> that build bridges between <strong>cultures</strong>.</>,
  //   philosophy: '"Every story is a seed. Plant it in the right soil and it transforms worlds."',
  //   accomplishments: [
  //     <>Crafted <strong>compelling narratives</strong> across music, film, and cultural projects.</>,
  //     <>Cultural strategist who builds <strong>authentic connections</strong> between art and audiences.</>,
  //     <>Master of finding truth in stories <strong>others overlook</strong>.</>,
  //     <>Created pathways for <strong>marginalized voices</strong> through authentic storytelling.</>
  //   ],
  //   socials: {
  //     instagram : "https://www.instagram.com/single.handedly?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw=="
  //   },
  // },
]

export default function Team() {
  const [expandedId, setExpandedId] = useState(null);

  return (
    <section id="team" className="py-20 px-6 bg-cream">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <p className="text-pumpkin font-black text-xs uppercase tracking-widest mb-2">WHO MADE IT</p>
          <h2 className="heading-font text-5xl md:text-6xl font-black text-wine mb-4">MEET THE TEAM</h2>
        </div>
        
        <div className="space-y-6 max-w-5xl mx-auto">
          {teamMembers.map((member) => (
            <motion.div
              key={member.id}
              layoutId={`card-${member.id}`}
              onClick={() => setExpandedId(expandedId === member.id ? null : member.id)}
              className="cursor-pointer transition-all duration-500"
              layout
            >
              <AnimatePresence mode="wait">
                {expandedId === member.id ? (
                  <motion.div
                    key={`expanded-${member.id}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.36 }}
                    className="rounded-2xl overflow-hidden bg-gradient-to-b from-transparent via-chestnut/30 to-wine/50 shadow-2xl"
                  >
                    <div className="flex gap-6 p-6">
                      <div className="flex-1">
                        <h3 className="text-2xl font-black text-wine mb-2">{member.name}</h3>
                        <p className="text-wine/80 font-bold text-sm mb-4">{member.role}</p>
                        <p className="text-sm text-wine/90 mb-3">{member.description}</p>
                        {member.philosophy && (
                          <p className="text-sm italic text-pumpkin mb-4 font-semibold">{member.philosophy}</p>
                        )}
                        <h4 className="text-xs font-black uppercase tracking-wider mb-2">Selected Works</h4>
                        <ul className="text-sm space-y-1 mb-4">
                          {member.accomplishments.map((a,i)=>(<li key={i}> {a}</li>))}
                        </ul>
                        <div className="flex gap-3">
                          {member.socials.instagram && <a href={member.socials.instagram} target="_blank" rel="noopener noreferrer" className="px-3 py-2 bg-pumpkin rounded text-cream text-xs" onClick={e=>e.stopPropagation()}>View Profile</a>}
                        </div>
                      </div>
                      <div className="relative w-48 h-64 flex-shrink-0 rounded-xl overflow-hidden">
                        <Image src={member.image} alt={member.name} layout="fill" objectFit="cover" />
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key={`collapsed-${member.id}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="flex gap-6 items-center bg-white rounded-2xl overflow-hidden shadow-lg p-6 group/card"
                  >
                    <div className="flex-1">
                      <h3 className="text-2xl font-black text-wine mb-1">{member.name}</h3>
                      <p className="text-wine/70 font-bold text-sm mb-3">{member.role}</p>
                      <p className="text-sm text-wine/60 line-clamp-2">{member.description}</p>
                      <p className="text-xs text-pumpkin font-bold mt-3 cursor-pointer">Click to see more →</p>
                    </div>
                    <div className="relative w-48 h-56 flex-shrink-0 rounded-xl overflow-hidden">
                      <Image 
                        src={member.image} 
                        alt={member.name}
                        layout="fill"
                        objectFit="cover"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>

        <div className="text-center mt-12 text-wine/60 text-xs uppercase tracking-wider font-bold">
          Click on any card to see achievements
        </div>
      </div>
    </section>
  )
}
