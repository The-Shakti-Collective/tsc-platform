export default function CoreValues() {
  const values = [
    {
      title: 'Amplify, Don\'t Erase',
      description: 'We center marginalized voices and make space for stories that challenge the mainstream. Every project asks: whose story needs to be told? Who\'ve we forgotten?',
      icon: '',
    },
    {
      title: 'Authenticity Over Aesthetics',
      description: 'We prioritize truth over polish. Real struggles, real joy, real humanity. If it serves the algorithm but betrays the artist, we won\'t do it.',
      icon: '',
    },
    {
      title: 'Community First',
      description: 'We measure success by the connections we build, not the metrics we hit. Every member of The Shakti Collective matters. Every voice counts.',
      icon: '',
    },
    {
      title: 'Sacred & Spiritual',
      description: 'Shakti is divine feminine energy. Our work honors the spiritual essence of creativity—the transformation that happens when art touches the soul.',
      icon: '',
    },
    {
      title: 'Collaboration Over Competition',
      description: 'We believe abundance grows through sharing. Artists rise together. Knowledge flows freely. Partnerships are sacred.',
      icon: '',
    },
    {
      title: 'Unlearn, Evolve, Transcend',
      description: 'We reject the broken systems that define success. We\'re building something new—where artists thrive, where marginalized voices lead, where culture transforms.',
      icon: '',
    },
  ]

  return (
    <section id="values" className="py-20 px-6 bg-cream">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <p className="text-pumpkin font-black text-xs uppercase tracking-widest mb-2">What We Stand For</p>
          <h2 className="heading-font text-5xl md:text-6xl font-black text-wine mb-4">Our Core Values</h2>
          <p className="text-wine/80 text-lg max-w-2xl mx-auto">These aren't corporate buzzwords—they're the principles that guide every decision we make and every project we take on.</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {values.map((value, index) => (
            <div key={index} className="bg-white rounded-lg p-8 border border-pumpkin/20 shadow-md hover:shadow-lg transition-all duration-300">
              <div className="text-5xl mb-4">{value.icon}</div>
              <h3 className="text-xl font-black text-wine mb-3">{value.title}</h3>
              <p className="text-wine/80 leading-relaxed">{value.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
