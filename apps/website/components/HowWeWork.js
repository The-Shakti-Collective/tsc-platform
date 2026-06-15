// export default function HowWeWork() {
//   const process = [
//     {
//       step: '01',
//       title: 'Listen',
//       description: 'We start by understanding the artist\'s soul, their story, their vision. Not what trends, but what truth they need to tell.',
//     },
//     {
//       step: '02',
//       title: 'Co-Create',
//       description: 'We collaborate deeply. Your voice isn\'t compromised—it\'s amplified. We\'re partners, not gatekeepers.',
//     },
//     {
//       step: '03',
//       title: 'Craft With Purpose',
//       description: 'Every creative decision serves the story. Every frame, every note, every word is intentional. We create art that transforms.',
//     },
//     {
//       step: '04',
//       title: 'Amplify Authentically',
//       description: 'We share your work in ways that honor its essence. We build communities, not just audiences. We create movements, not campaigns.',
//     },
//   ]

//   return (
//     <section id="process" className="py-20 px-6 bg-sea-foam dark:bg-peacock">
//       <div className="container mx-auto">
//         <div className="text-center mb-16">
//           <p className="text-cream font-black text-xs uppercase tracking-widest mb-2">Our Methodology</p>
//           <h2 className="heading-font text-5xl md:text-6xl font-black text-cream mb-4">How We Work</h2>
//           <p className="text-cream/80 text-lg max-w-2xl mx-auto">Our approach to creative collaboration is rooted in respect, authenticity, and a deep commitment to amplifying your vision.</p>
//         </div>

//         <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
//           {process.map((item, index) => (
//             <div key={index} className="relative">
//               <div className="bg-chestnut/20 rounded-lg p-8 h-full border border-cream/10">
//                 <div className="text-5xl font-black text-pumpkin mb-4 opacity-30">{item.step}</div>
//                 <h3 className="text-xl font-black text-cream mb-3">{item.title}</h3>
//                 <p className="text-cream/80 leading-relaxed">{item.description}</p>
//               </div>
//               {index < process.length - 1 && (
//                 <div className="hidden lg:block absolute -right-4 top-1/2 transform -translate-y-1/2">
//                   <div className="text-pumpkin text-3xl">→</div>
//                 </div>
//               )}
//             </div>
//           ))}
//         </div>

//         <div className="mt-16 text-center">
//           <p className="text-cream/80 text-lg italic max-w-3xl mx-auto">
//             "We believe the best work happens when there's trust, when the artist feels seen, and when the creative process itself becomes transformative. That's the Shakti way."
//           </p>
//         </div>
//       </div>
//     </section>
//   )
// }
