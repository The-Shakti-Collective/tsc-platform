export default function WhyWeExist() {
  return (
    <section id="philosophy" className="py-20 px-6 bg-wine">
      <div className="container mx-auto max-w-4xl">
        <div className="text-center mb-12">
          <p className="text-cream font-black text-xs uppercase tracking-widest mb-4">Our Philosophy</p>
          <h2 className="heading-font text-5xl md:text-6xl font-black text-cream mb-6">Why Art Matters</h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-pumpkin/10 rounded-lg p-8 border border-pumpkin/20">
            <h3 className="text-2xl font-black text-cream mb-4">Music is Memory</h3>
            <p className="text-cream/90 leading-relaxed">
              It carries the stories we can't speak. It holds the pain we can't articulate. It keeps alive the voices of those silenced by systems. Every song is an act of remembrance.
            </p>
          </div>

          <div className="bg-pumpkin/10 rounded-lg p-8 border border-pumpkin/20">
            <h3 className="text-2xl font-black text-cream mb-4">Stories are Resistance</h3>
            <p className="text-cream/90 leading-relaxed">
              When marginalized voices tell their own narratives, they reclaim their power. They refuse erasure. They build futures where belonging isn't determined by gatekeepers but by authenticity.
            </p>
          </div>

          <div className="bg-pumpkin/10 rounded-lg p-8 border border-pumpkin/20">
            <h3 className="text-2xl font-black text-cream mb-4">Community is Power</h3>
            <p className="text-cream/90 leading-relaxed">
              Shakti flows through connection. When artists stand together, when dreamers find their tribe, when marginalized voices amplify each other—that's when transformation becomes possible.
            </p>
          </div>
        </div>

        <div className="mt-12 bg-cream/5 rounded-lg p-8 border border-cream/10">
          <p className="text-center text-cream/80 text-lg leading-relaxed italic">
            "We don't create content for algorithms. We create offerings for the soul. We don't build platforms for profit. We build sanctuaries for the artists the world forgot."
          </p>
        </div>
      </div>
    </section>
  )
}
