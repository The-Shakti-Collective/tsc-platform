import { motion } from 'framer-motion'

export default function Hero() {

  return (
    <section className="relative h-screen overflow-hidden bg-black">
      {/* Liquid Morphic Background */}
      <div className="absolute inset-0 w-full h-full opacity-50">
        <svg
          className="w-full h-full"
          viewBox="0 0 1200 800"
          preserveAspectRatio="xMidYMid slice"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <filter id="gooey">
              <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="coloredBlur" />
              <feComponentTransfer in="coloredBlur">
                <feFuncA type="linear" slope="0.5"/>
              </feComponentTransfer>
            </filter>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FF6B35" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#8B3A3A" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#6B4423" stopOpacity="0.8" />
            </linearGradient>
          </defs>
          <g filter="url(#gooey)">
            <motion.circle
              cx="600"
              cy="400"
              r="200"
              fill="url(#gradient)"
              animate={{
                cx: [600, 700, 500, 600],
                cy: [400, 300, 500, 400],
                r: [200, 250, 180, 200]
              }}
              transition={{
                duration: 20,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            <motion.circle
              cx="400"
              cy="300"
              r="150"
              fill="url(#gradient)"
              animate={{
                cx: [400, 300, 500, 400],
                cy: [300, 500, 200, 300],
                r: [150, 200, 180, 150]
              }}
              transition={{
                duration: 18,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            <motion.circle
              cx="800"
              cy="500"
              r="180"
              fill="url(#gradient)"
              animate={{
                cx: [800, 900, 700, 800],
                cy: [500, 250, 450, 500],
                r: [180, 220, 160, 180]
              }}
              transition={{
                duration: 22,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          </g>
        </svg>
      </div>

      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black/30"></div>

      {/* Scroll Indicator */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full text-cream text-center px-6">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="font-comfortaa text-5xl md:text-7xl font-bold mb-4"
        >
          <span className="text-gradient">
            The Shakti Collective
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="text-lg md:text-xl font-light tracking-wider mb-8 text-cream/80"
        >
          Amplifying the voices that reshape culture
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-4 mb-16"
        >
          <a 
            href="#projects" 
            className="btn-primary"
            onClick={() => {
              window.gtag?.('event', 'click', {
                event_category: 'engagement',
                event_label: 'view_work_button',
                value: 1
              });
            }}
          >
            Explore Our Work
          </a>
          <a 
            href="https://www.instagram.com/the_shakti_collective?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="btn-secondary"
            onClick={() => {
              window.gtag?.('event', 'click', {
                event_category: 'social',
                event_label: 'instagram_button',
                value: 1
              });
            }}
          >
            Be Part of Us
          </a>
        </motion.div>
      </div>

      {/* Scroll Indicator - Bottom */}
      <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 z-10">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="scroll-down-animation"
        >
          <div className="mouse">
            <div className="scroll-wheel"></div>
          </div>
          <span className="text-cream/80 text-sm tracking-widest">SCROLL TO EXPLORE</span>
        </motion.div>
      </div>
    </section>
  )
}