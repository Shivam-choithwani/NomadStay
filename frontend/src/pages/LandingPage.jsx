import { Link } from "react-router-dom";
import { useEffect } from "react";

export default function LandingPage() {
  useEffect(() => {
    // Intersection Observer for scroll fade-in effects
    const observerOptions = {
      threshold: 0.1,
      rootMargin: "0px 0px -50px 0px"
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('opacity-100', 'translate-y-0');
          entry.target.classList.remove('opacity-0', 'translate-y-12');
        }
      });
    }, observerOptions);

    const elementsToObserve = document.querySelectorAll('.animate-on-scroll');
    elementsToObserve.forEach(el => {
      el.classList.add('transition-all', 'duration-1000', 'ease-out', 'opacity-0', 'translate-y-12');
      observer.observe(el);
    });

    return () => {
      elementsToObserve.forEach(el => observer.unobserve(el));
    };
  }, []);

  return (
    <main className="font-body-md text-body-md overflow-x-hidden bg-background selection:bg-primary-container selection:text-on-primary-container">
      
      {/* 1. Cinematic Hero Section */}
      <section className="relative w-full h-[90vh] min-h-[600px] flex flex-col justify-center items-center text-center overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <img 
            src="/assets/images/hero_nomads.png" 
            alt="Digital Nomads working at a tropical terrace" 
            className="w-full h-full object-cover object-center scale-105 animate-[slowZoom_20s_ease-in-out_infinite_alternate]"
          />
          {/* Gradient Overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-background"></div>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 px-margin-mobile md:px-margin-desktop max-w-4xl mx-auto flex flex-col items-center animate-on-scroll">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-surface/20 backdrop-blur-md border border-white/30 text-white mb-6 font-label-sm uppercase tracking-widest shadow-lg">
            <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse"></span>
            Join 50,000+ Global Nomads
          </div>
          
          <h1 className="font-display-lg text-4xl md:text-7xl lg:text-8xl text-white font-extrabold tracking-tight mb-6 leading-tight drop-shadow-2xl">
            Live Anywhere.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-fixed to-secondary-fixed">
              Exchange Skills.
            </span>
          </h1>
          
          <p className="font-body-lg text-lg md:text-xl text-white/90 mb-10 max-w-2xl text-shadow-sm font-medium">
            NomadeStay is the premier global network connecting digital nomads. Trade your expertise for free accommodation in 120+ countries.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <Link
              to="/register"
              className="inline-flex items-center justify-center bg-primary hover:bg-primary/90 text-on-primary font-bold py-4 px-10 rounded-2xl shadow-xl shadow-primary/30 active:scale-95 transition-all text-lg"
            >
              Start Your Journey
            </Link>
            <Link
              to="/explore"
              className="inline-flex items-center justify-center bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/30 text-white font-bold py-4 px-10 rounded-2xl transition-all active:scale-95 text-lg"
            >
              Explore Map
            </Link>
          </div>
        </div>
      </section>

      {/* 2. Infinite Scroll Marquee */}
      <div className="w-full bg-surface-container-lowest border-y border-outline-variant/30 py-6 overflow-hidden relative flex items-center">
        {/* Fading edges */}
        <div className="absolute left-0 top-0 bottom-0 w-16 md:w-32 bg-gradient-to-r from-surface-container-lowest to-transparent z-10 pointer-events-none"></div>
        <div className="absolute right-0 top-0 bottom-0 w-16 md:w-32 bg-gradient-to-l from-surface-container-lowest to-transparent z-10 pointer-events-none"></div>
        
        <div className="flex whitespace-nowrap animate-[marquee_30s_linear_infinite] gap-12 items-center font-headline-md text-2xl md:text-4xl text-on-surface-variant/50 font-black uppercase tracking-wider">
          <span>Bali</span> • <span>Lisbon</span> • <span>Medellín</span> • <span>Chiang Mai</span> • <span>Tulum</span> • <span>Cape Town</span> • <span>Tokyo</span> •
          <span>Bali</span> • <span>Lisbon</span> • <span>Medellín</span> • <span>Chiang Mai</span> • <span>Tulum</span> • <span>Cape Town</span> • <span>Tokyo</span>
        </div>
      </div>

      {/* 3. Premium Bento Grid Features */}
      <section className="py-24 px-margin-mobile md:px-margin-desktop bg-background">
        <div className="max-w-container-max mx-auto">
          <div className="text-center mb-16 animate-on-scroll">
            <h2 className="font-display-lg text-3xl md:text-5xl text-on-surface mb-4">A Network Built for Nomads</h2>
            <p className="font-body-lg text-on-surface-variant max-w-2xl mx-auto">Everything you need to travel the world, build your portfolio, and find your global tribe.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[250px]">
            {/* Feature 1: Global Map (Large Card) */}
            <div className="md:col-span-2 md:row-span-2 bg-surface rounded-[32px] shadow-[0px_4px_30px_rgba(0,0,0,0.03)] border border-outline-variant/20 p-8 md:p-12 relative overflow-hidden group hover:border-primary/50 transition-colors duration-500 animate-on-scroll">
              <div className="relative z-10 w-full md:w-1/2">
                <div className="w-14 h-14 bg-primary-container rounded-2xl flex items-center justify-center mb-6">
                  <span className="material-symbols-outlined text-primary text-3xl">public</span>
                </div>
                <h3 className="font-display-lg text-3xl text-on-surface mb-3">Interactive Global Map</h3>
                <p className="text-on-surface-variant font-body-lg leading-relaxed">
                  Discover thousands of hosts offering spaces in exchange for your unique skills. Real-time availability layered on a beautiful 3D map interface.
                </p>
              </div>
              <div className="absolute -bottom-10 -right-10 w-3/4 h-full md:h-auto md:w-[60%] opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700 pointer-events-none">
                 <img src="/assets/images/bento_map.png" alt="3D Map" className="w-full h-full object-cover object-left-top rounded-tl-[32px]" />
              </div>
            </div>

            {/* Feature 2: Verified Trust */}
            <div className="bg-surface rounded-[32px] shadow-[0px_4px_30px_rgba(0,0,0,0.03)] border border-outline-variant/20 p-8 flex flex-col justify-between group hover:border-tertiary/50 transition-colors duration-500 animate-on-scroll">
              <div className="w-14 h-14 bg-tertiary-container rounded-2xl flex items-center justify-center">
                <span className="material-symbols-outlined text-tertiary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>verified_user</span>
              </div>
              <div>
                <h3 className="font-headline-lg text-xl text-on-surface mb-2">Verified Trust</h3>
                <p className="text-on-surface-variant">Gov-ID verification and community reviews keep the ecosystem safe.</p>
              </div>
            </div>

            {/* Feature 3: Skill Portfolios */}
            <div className="bg-surface rounded-[32px] shadow-[0px_4px_30px_rgba(0,0,0,0.03)] border border-outline-variant/20 p-8 flex flex-col justify-between group hover:border-secondary/50 transition-colors duration-500 animate-on-scroll">
              <div className="w-14 h-14 bg-secondary-container rounded-2xl flex items-center justify-center">
                <span className="material-symbols-outlined text-secondary text-3xl">psychology</span>
              </div>
              <div>
                <h3 className="font-headline-lg text-xl text-on-surface mb-2">Skill Portfolios</h3>
                <p className="text-on-surface-variant">Showcase your expertise as a developer, marketer, or creator.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Interactive "How It Works" */}
      <section className="bg-surface-container-low py-24 px-margin-mobile md:px-margin-desktop overflow-hidden">
        <div className="max-w-container-max mx-auto relative">
          <h2 className="font-display-lg text-3xl md:text-5xl text-center mb-20 animate-on-scroll text-on-surface">How NomadeStay Works</h2>
          
          <div className="relative">
            {/* Connecting Line (Desktop) */}
            <div className="hidden md:block absolute top-1/2 left-0 w-full h-1 bg-outline-variant/30 -translate-y-1/2 z-0"></div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8 relative z-10">
              {/* Step 1 */}
              <div className="bg-surface p-8 rounded-3xl shadow-xl shadow-surface-tint/5 flex flex-col items-center text-center animate-on-scroll border border-outline-variant/20 relative group">
                <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center text-white font-display-lg text-3xl mb-6 shadow-lg shadow-primary/30 group-hover:scale-110 transition-transform">1</div>
                <h3 className="font-headline-lg text-2xl mb-3 text-on-surface">Create Profile</h3>
                <p className="text-on-surface-variant">Build a stunning portfolio showcasing your skills, past travels, and verify your identity.</p>
              </div>
              
              {/* Step 2 */}
              <div className="bg-surface p-8 rounded-3xl shadow-xl shadow-surface-tint/5 flex flex-col items-center text-center animate-on-scroll border border-outline-variant/20 relative group mt-0 md:mt-12">
                <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center text-white font-display-lg text-3xl mb-6 shadow-lg shadow-primary/30 group-hover:scale-110 transition-transform">2</div>
                <h3 className="font-headline-lg text-2xl mb-3 text-on-surface">Propose Exchange</h3>
                <p className="text-on-surface-variant">Find the perfect stay and propose a skill exchange (e.g., "I'll build your website for a 2-week stay").</p>
              </div>
              
              {/* Step 3 */}
              <div className="bg-surface p-8 rounded-3xl shadow-xl shadow-surface-tint/5 flex flex-col items-center text-center animate-on-scroll border border-outline-variant/20 relative group mt-0 md:-mt-12">
                <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center text-white font-display-lg text-3xl mb-6 shadow-lg shadow-primary/30 group-hover:scale-110 transition-transform">3</div>
                <h3 className="font-headline-lg text-2xl mb-3 text-on-surface">Travel Freely</h3>
                <p className="text-on-surface-variant">Connect with hosts, travel the world for free, and forge lifelong global connections.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Enhanced CTA Section */}
      <section className="px-margin-mobile md:px-margin-desktop py-24 bg-background">
        <div className="max-w-container-max mx-auto">
          <div className="bg-primary rounded-[40px] p-10 md:p-20 text-center shadow-2xl shadow-primary/20 overflow-hidden relative animate-on-scroll">
            <div className="relative z-10 max-w-2xl mx-auto">
              <h2 className="font-display-lg text-4xl md:text-6xl text-white mb-6">Ready to start your journey?</h2>
              <p className="font-body-lg text-white/90 text-xl mb-10">Stop paying for expensive Airbnbs. Start exchanging your skills for incredible stays around the globe today.</p>
              <Link
                to="/register"
                className="inline-flex items-center justify-center bg-white text-primary hover:bg-surface-container-low font-bold py-5 px-12 rounded-2xl active:scale-95 transition-transform text-xl shadow-lg"
              >
                Join For Free
              </Link>
            </div>
            {/* Abstract visual elements */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary/30 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3"></div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full px-margin-mobile md:px-margin-desktop py-16 bg-surface-container border-t border-outline-variant/20">
        <div className="max-w-container-max mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="md:col-span-2 flex flex-col gap-4">
            <span className="font-display-lg text-3xl text-on-surface font-bold tracking-tight">NomadeStay</span>
            <p className="text-on-surface-variant font-body-md max-w-sm">The global social network for digital nomads to find community and skill-exchange stays.</p>
            <p className="text-on-surface-variant/60 font-label-sm mt-4">© 2026 NomadeStay. All rights reserved.</p>
          </div>
          <div className="flex flex-col gap-4">
            <span className="font-headline-md text-on-surface">Platform</span>
            <Link to="/explore" className="text-on-surface-variant hover:text-primary transition-colors">Find Stays</Link>
            <a href="#" className="text-on-surface-variant hover:text-primary transition-colors">How it Works</a>
            <a href="#" className="text-on-surface-variant hover:text-primary transition-colors">Trust & Safety</a>
          </div>
          <div className="flex flex-col gap-4">
            <span className="font-headline-md text-on-surface">Legal</span>
            <a href="#" className="text-on-surface-variant hover:text-primary transition-colors">Privacy Policy</a>
            <a href="#" className="text-on-surface-variant hover:text-primary transition-colors">Terms of Service</a>
          </div>
        </div>
      </footer>

      {/* Map FAB (Floating Action Button) */}
      <Link to="/explore" className="fixed right-6 bottom-6 md:right-10 md:bottom-10 w-16 h-16 bg-primary text-on-primary rounded-full shadow-2xl shadow-primary/40 flex items-center justify-center z-50 active:scale-90 transition-transform hover:bg-primary/90">
        <span className="material-symbols-outlined text-3xl">explore</span>
      </Link>
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
        @keyframes slowZoom {
          0% { transform: scale(1.05); }
          100% { transform: scale(1.15); }
        }
      `}} />
    </main>
  );
}
