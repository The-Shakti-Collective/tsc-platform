export default function About() {
  return (
    <section id="about" className="py-20 px-6 bg-cream">
      <div className="container mx-auto grid lg:grid-cols-2 gap-12 items-center">
        {/* Video Column - responsive 16:9 on mobile, fixed height on large */}
        <div className="w-full rounded-lg overflow-hidden shadow-lg">
          <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
            <video
              className="absolute inset-0 w-full h-full object-cover"
              src="/assets/hero.mp4"
              autoPlay
              loop
              muted
              playsInline
            >
              Your browser does not support the video tag.
            </video>
          </div>
        </div>

        {/* Text Column - improved layout */}
        <div>
          <p className="text-pumpkin font-black text-xs uppercase tracking-widest mb-2">Our Story</p>
          <h2 className="heading-font text-4xl font-bold mb-4 text-wine">Why We Exist</h2>
          <p className="text-lg text-wine/80 mb-6">
            Shakti means power—the sacred feminine energy that flows through creation itself. We didn't start The Shakti Collective to build another media company. We started it because we saw untold stories, unheard melodies, and voices suffocated by systems that profit from conformity. We started it as an act of resistance and devotion.
          </p>

          <p className="text-lg text-wine/80 mb-6">
            Every project we touch is rooted in purpose. We don't just create content; we create vessels for cultural conversations that matter. Through music, through storytelling, through community—we amplify the voices that the world needs to hear. We build spaces where artists can unfold themselves authentically, where culture breathes freely.
          </p>

          <div className="grid sm:grid-cols-2 gap-6">
            <div>
              <h4 className="text-pumpkin font-bold mb-2">Our Philosophy</h4>
              <p className="text-wine/80 text-sm">Art isn't decoration. It's transformation. Music isn't entertainment. It's memory, resistance, and healing. We create from this sacred understanding.</p>
            </div>
            <div>
              <h4 className="text-pumpkin font-bold mb-2">Our Commitment</h4>
              <p className="text-wine/80 text-sm">We exist to amplify underrepresented voices, build authentic cultural narratives, nurture emerging artists, and foster communities where creativity thrives.</p>
            </div>
          </div>

          <div className="mt-6">
            <a href="https://www.instagram.com/the_shakti_collective?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==" target="_blank" rel="noopener noreferrer" className="inline-block px-6 py-3 bg-pumpkin text-cream rounded-md font-bold text-sm hover:bg-pumpkin/90 transition-colors">Join the Collective</a>
          </div>
        </div>
      </div>
    </section>
  )
}
