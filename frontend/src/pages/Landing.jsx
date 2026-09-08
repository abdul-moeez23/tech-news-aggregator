import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

function Landing() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary overflow-x-hidden font-sans">
      {/* Navbar */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-bg-primary/90 backdrop-blur-md border-b border-border-subtle py-4' : 'bg-transparent py-6'}`}>
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-blue to-accent-purple flex items-center justify-center">
              <span className="text-[#FAFAFA] font-bold text-lg leading-none">T</span>
            </div>
            <span className="text-xl font-bold tracking-tight text-text-primary">TechPulse</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-text-secondary">
            <a href="#features" className="hover:text-text-primary transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-text-primary transition-colors">How It Works</a>
            <a href="#sources" className="hover:text-text-primary transition-colors">Sources</a>
            <a href="#about" className="hover:text-text-primary transition-colors">About</a>
          </div>

          <div className="flex items-center gap-4">
            <Link to="/login" className="text-sm font-semibold text-text-secondary hover:text-accent-blue transition-colors">Log In</Link>
            <Link to="/signup" className="text-sm font-bold bg-accent-blue text-white px-6 py-2.5 rounded-full hover:bg-accent-blue/90 hover:shadow-lg transition-all">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-40 pb-20 px-6 relative max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-16">
        {/* Background glow */}
        <div className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent-blue/10 rounded-full blur-[120px] pointer-events-none -z-10"></div>
        <div className="absolute top-1/2 right-1/4 translate-x-1/4 -translate-y-1/2 w-[500px] h-[500px] bg-accent-purple/10 rounded-full blur-[120px] pointer-events-none -z-10"></div>

        <div className="flex-1 flex flex-col gap-8 items-start relative z-10">
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.1] text-text-primary">
            All the tech news you care about.<br />
            <span className="text-gradient-primary">In one place.</span>
          </h1>
          <p className="text-lg md:text-xl text-text-secondary max-w-xl leading-relaxed">
            Choose your topics and trusted sources. We aggregate the latest technology stories, insights, and updates into one personalized feed.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 pt-4 w-full sm:w-auto">
            <Link to="/signup" className="bg-gradient-to-r from-accent-blue to-accent-purple text-white font-bold px-8 py-4 rounded-full text-center hover:shadow-[0_10px_25px_rgba(18,59,69,0.3)] hover:-translate-y-0.5 transition-all">
              Get Started
            </Link>
            <button className="bg-white border-2 border-border-subtle text-text-primary font-bold px-8 py-4 rounded-full text-center hover:border-accent-blue hover:text-accent-blue transition-colors">
              Explore Demo
            </button>
          </div>
          <p className="text-sm text-text-muted font-medium pt-2 flex items-center gap-2">
            <svg className="w-4 h-4 text-accent-cyan" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>
            Aggregating insights from leading technology sources.
          </p>
        </div>

        {/* Hero Visual: Dashboard Preview */}
        <div className="flex-1 w-full relative z-10">
          <div className="bg-bg-card border border-border-subtle rounded-2xl shadow-2xl overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none"></div>
            
            {/* Fake Header */}
            <div className="border-b border-border-subtle px-6 py-4 flex items-center justify-between bg-bg-card/50">
              <div className="flex gap-4">
                <div className="w-24 h-6 bg-border-subtle rounded-md"></div>
                <div className="w-16 h-6 bg-bg-card-elevated rounded-md"></div>
                <div className="w-20 h-6 bg-bg-card-elevated rounded-md"></div>
              </div>
              <div className="w-8 h-8 rounded-full bg-accent-blue/20"></div>
            </div>

            {/* Fake Content */}
            <div className="p-6 flex gap-6">
              <div className="flex-1 flex flex-col gap-4">
                {[1, 2].map((i) => (
                  <div key={i} className="bg-bg-card-elevated border border-border-subtle p-4 rounded-xl">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-5 h-5 rounded bg-white/20"></div>
                      <div className="text-xs text-text-secondary font-medium">TechCrunch · 2h ago</div>
                    </div>
                    <div className="w-3/4 h-5 bg-white/80 rounded mb-2"></div>
                    <div className="w-full h-3 bg-text-muted/50 rounded mb-1"></div>
                    <div className="w-5/6 h-3 bg-text-muted/50 rounded mb-4"></div>
                    <div className="flex gap-2">
                      <div className="px-2 py-1 rounded bg-accent-blue/10 text-[10px] text-accent-blue font-semibold border border-accent-blue/20">AI</div>
                      <div className="px-2 py-1 rounded bg-bg-card border border-border-subtle text-[10px] text-text-secondary font-semibold">Startups</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="w-1/3 hidden lg:flex flex-col gap-4">
                 <div className="bg-bg-card-elevated border border-border-subtle p-4 rounded-xl h-full">
                    <div className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-4">Trending Topics</div>
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="flex items-center justify-between mb-3">
                        <div className="w-1/2 h-3 bg-white/60 rounded"></div>
                        <div className="w-6 h-3 bg-border-subtle rounded"></div>
                      </div>
                    ))}
                 </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 bg-bg-secondary border-y border-border-subtle">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-text-primary">How It Works</h2>
            <p className="text-text-secondary text-lg">Three steps to your perfect news diet.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              { num: '01', title: 'Choose Your Topics', desc: 'Select from categories like AI, Startups, Cloud, Cybersecurity, and more.' },
              { num: '02', title: 'Pick Your Sources', desc: 'Select from hundreds of trusted technology publications, engineering blogs, and newsletters.' },
              { num: '03', title: 'Get Your Personalized Feed', desc: 'We collect, filter, and organize the stories into one clean, intelligent feed.' }
            ].map((step, i) => (
              <div key={i} className="flex flex-col gap-4">
                <div className="text-accent-blue font-bold text-5xl mb-2 opacity-50">{step.num}</div>
                <h3 className="text-xl font-bold text-text-primary">{step.title}</h3>
                <p className="text-text-secondary leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-text-primary">Powerful Features</h2>
          <p className="text-text-secondary text-lg">Built for professionals who need to stay informed.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { 
              title: 'Multi-Source Aggregation', 
              desc: 'Bring related stories from multiple technology sources into one place.',
              icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
            },
            { 
              title: 'Personalized Topics', 
              desc: 'You control which technology topics appear in your feed.',
              icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path>
            },
            { 
              title: 'Smart Summaries', 
              desc: 'Provide concise AI summaries so you can understand a story quickly.',
              icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
            },
            { 
              title: 'Source Comparison', 
              desc: 'See how different sources are covering the exact same story.',
              icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path>
            },
            { 
              title: 'Trending Technology', 
              desc: 'Highlight the most important and popular technology stories globally.',
              icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
            },
            { 
              title: 'Save for Later', 
              desc: 'Bookmark interesting stories to read when you have more time.',
              icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"></path>
            },
          ].map((feature, i) => (
            <div key={i} className="bg-bg-card border border-border-subtle p-8 rounded-2xl hover:-translate-y-1 hover:border-accent-blue/50 transition-all duration-300">
              <div className="w-10 h-10 rounded-lg bg-bg-card-elevated border border-border-subtle flex items-center justify-center mb-6 text-accent-blue">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">{feature.icon}</svg>
              </div>
              <h3 className="text-xl font-bold mb-3 text-text-primary">{feature.title}</h3>
              <p className="text-text-secondary leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border-subtle bg-bg-secondary text-center">
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="w-6 h-6 rounded-md bg-gradient-to-br from-accent-blue to-accent-purple flex items-center justify-center">
            <span className="text-text-primary font-bold text-xs">T</span>
          </div>
          <span className="text-lg font-bold text-text-primary">TechPulse</span>
        </div>
        <p className="text-text-muted text-sm">&copy; {new Date().getFullYear()} TechPulse. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default Landing;
