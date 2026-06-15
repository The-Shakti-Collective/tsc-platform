import Image from "next/legacy/image"
import { FaLinkedin, FaTwitter, FaInstagram } from 'react-icons/fa'
import { useState, useEffect } from 'react'

export default function Footer() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const handleSubscribe = async (e) => {
    e.preventDefault();
    
    if (!email) {
      setMessage('Please enter a valid email');
      return;
    }

    setIsLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/newsletter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Thank you for subscribing!');
        setEmail('');
      } else {
        setMessage(data.error || 'Something went wrong. Please try again.');
      }
    } catch (error) {
      console.error('Error subscribing:', error);
      setMessage('Failed to subscribe. Please try again later.');
    } finally {
      setIsLoading(false);
    }

    // Clear message after 3 seconds
    setTimeout(() => setMessage(''), 3000);
  };

  return (
    <footer className="relative bg-gradient-primary text-cream overflow-hidden">
      <div className="pattern-container absolute inset-0">
        <div className="absolute inset-0">
          <Image 
            src="/assets/Patterns/LogoArtboard 17@300x-8.png" 
            alt="Background Pattern" 
            layout="fill" 
            objectFit="cover" 
            className="opacity-30"
          />
        </div>
      </div>
      <div className="container mx-auto px-6 py-16 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 items-start">
          {/* Quick Links - 25% width */}
          <div>
            <h4 className="text-cream font-bold mb-4 uppercase text-sm tracking-wide">Quick Links</h4>
            <div className="space-y-3">
              <a href="#projects" className="block text-cream/80 hover:text-pumpkin transition-colors text-sm">
                Our Projects
              </a>
              <a href="#team" className="block text-cream/80 hover:text-pumpkin transition-colors text-sm">
                Meet the Team
              </a>
              <a href="#artists" className="block text-cream/80 hover:text-pumpkin transition-colors text-sm">
                Artist Community
              </a>
              <a href="#contact" className="block text-cream/80 hover:text-pumpkin transition-colors text-sm">
                Contact
              </a>
            </div>
          </div>

          {/* Connect With Us - 25% width */}
          <div>
            <h4 className="text-cream font-bold mb-4 uppercase text-sm tracking-wide">Connect</h4>
            <div className="space-y-3">
              <a 
                href="https://www.instagram.com/the_shakti_collective?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex items-center gap-3 text-cream hover:text-pumpkin transition-colors group text-sm"
              >
                <FaInstagram size={18} />
                <span>Instagram</span>
              </a>
              <a 
                href="https://www.linkedin.com/in/rohitsobti/" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex items-center gap-3 text-cream hover:text-pumpkin transition-colors group text-sm"
              >
                <FaLinkedin size={18} />
                <span>LinkedIn</span>
              </a>
              <a 
                href="#" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex items-center gap-3 text-cream hover:text-pumpkin transition-colors group text-sm"
              >
                <FaTwitter size={18} />
                <span>Twitter</span>
              </a>
            </div>
          </div>

          {/* Newsletter Section - 50% width (spans 2 columns) */}
          <div className="md:col-span-2">
            <h3 className="text-xl font-bold mb-3 heading-font text-pumpkin">Join Our Collective</h3>
            <p className="mb-4 text-cream/80 text-sm leading-relaxed">Get the latest on our projects, creative insights, and exclusive updates delivered to your inbox.</p>
            <form className="flex flex-row gap-2 mb-3" onSubmit={handleSubscribe}>
              <input 
                type="email" 
                placeholder="Your Email Address" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 px-4 py-3 text-sm text-pumpkin rounded-md focus:outline-none focus:ring-2 focus:ring-pumpkin bg-cream placeholder-pumpkin/50" 
                required 
              />
              <button 
                type="submit" 
                disabled={isLoading}
                className="px-6 py-3 bg-pumpkin text-cream font-bold rounded-md hover:bg-pumpkin/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap text-sm"
              >
                {isLoading ? 'Subscribing...' : 'Subscribe'}
              </button>
            </form>
            {message && (
              <p className={`text-sm ${message.includes('Thank you') ? 'text-green-300' : 'text-red-300'}`}>
                {message}
              </p>
            )}
            
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-cream/20">
          <div className="flex flex-col md:flex-row justify-between items-center text-sm text-cream/70 gap-6">
            <p className="text-sm">&copy; {new Date().getFullYear()} The Shakti Collective. All Rights Reserved.</p>
            <div className="flex gap-6 text-sm">
              <a href="#" className="hover:text-pumpkin transition-colors">
                Privacy Policy
              </a>
              <a href="#" className="hover:text-pumpkin transition-colors">
                Terms of Service
              </a>
              <a href="#" className="hover:text-pumpkin transition-colors">
                Sitemap
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}