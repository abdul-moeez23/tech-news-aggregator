import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import api from '../api/api';
import { loginSuccess } from '../store/authSlice';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/auth/login/', { username: email, password: password });
      dispatch(loginSuccess({ access: response.data.access }));
      navigate('/dashboard');
    } catch (err) {
      setErrorMsg('Invalid credentials.');
    }
  };

  return (
    <div className="h-screen overflow-hidden flex flex-col md:flex-row font-sans bg-bg-primary">
      {/* Left Panel - Dark Petrol Background */}
      <div className="hidden md:flex md:w-[55%] bg-accent-blue flex-col justify-between p-8 lg:p-12 relative overflow-y-auto h-full">
        {/* Subtle background glow/overlay if needed */}
        <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-white/5 to-transparent pointer-events-none"></div>
        
        {/* Top: Logo */}
        <div className="relative z-10">
          <Link to="/" className="flex items-center gap-2 inline-flex">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-blue to-accent-purple flex items-center justify-center shadow-lg">
              <span className="text-[#FAFAFA] font-bold text-lg leading-none">T</span>
            </div>
            <span className="text-xl font-bold tracking-tight text-white">TechPulse</span>
          </Link>
        </div>

        {/* Middle: Content */}
        <div className="relative z-10 flex flex-col items-center justify-center flex-1 my-2 xl:my-8 w-full">
          <div className="max-w-xl w-full mx-auto flex flex-col gap-4 xl:gap-8">
            {/* Heading */}
            <div className="w-full">
              <h1 className="text-3xl lg:text-4xl 2xl:text-5xl font-bold tracking-tight leading-[1.1] text-white">
                All the tech news<br/>you care about.<br />
                <span className="text-transparent" style={{ WebkitTextStroke: '1px rgba(255,255,255,0.2)' }}>In one place.</span>
              </h1>
            </div>

            {/* Dashboard Preview Cards - Full Width */}
            <div className="w-full flex flex-col gap-2 xl:gap-3 relative z-10 opacity-80">
              {/* Added a fading mask effect or just stack them */}
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-accent-blue pointer-events-none z-20"></div>
              {[
                {
                  source: "TechCrunch - 2h ago",
                  headline: "Mank Crunch - Startups: The'news banfest the latest continuen-rinming technology stories, marketing"
                },
                {
                  source: "TechCrunch - 2h ago",
                  headline: "AewCrunch conwensed the AI to grow: henxr markets in Technology:"
                },
                {
                  source: "TechCrunch - 2h ago",
                  headline: "AI deepezt.estaman new straakout: Technology our production"
                }
              ].map((card, i) => (
                <div key={i} className={`bg-white/5 border border-white/10 p-3 xl:p-4 rounded-xl backdrop-blur-sm shadow-lg relative z-10 ${i === 2 ? 'hidden lg:block' : ''}`}>
                  <div className="flex items-center gap-2 mb-1 xl:mb-2">
                    <div className="w-3 h-3 xl:w-4 xl:h-4 rounded bg-white/10"></div>
                    <span className="text-[10px] xl:text-xs text-white/70 font-medium">{card.source}</span>
                  </div>
                  <h3 className="text-xs xl:text-sm font-medium text-white/90 leading-relaxed mb-2 xl:mb-3 pr-2 line-clamp-2">
                    {card.headline}
                  </h3>
                  <div className="flex gap-2">
                    <span className="px-2 py-0.5 xl:py-1 rounded bg-white/10 text-[9px] xl:text-[10px] text-white/80 font-medium border border-white/5">AI</span>
                    <span className="px-2 py-0.5 xl:py-1 rounded bg-white/10 text-[9px] xl:text-[10px] text-white/80 font-medium border border-white/5">Startups</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom: Back to Home */}
        <div className="relative z-10">
          <Link to="/" className="inline-flex items-center gap-2 px-6 py-2.5 bg-white text-text-primary font-semibold rounded-full hover:bg-gray-100 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
            Back to Home
          </Link>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-bg-secondary h-full overflow-y-auto">
        <div className="w-full max-w-[360px] flex flex-col justify-center">
          
          <div className="flex justify-center mb-10 md:hidden">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-blue to-accent-purple flex items-center justify-center">
                <span className="text-[#FAFAFA] font-bold text-lg leading-none">T</span>
              </div>
              <span className="text-xl font-bold tracking-tight text-text-primary">TechPulse</span>
            </Link>
          </div>

          <h2 className="text-3xl font-bold text-center text-text-primary mb-2">Welcome back</h2>
          <p className="text-center text-text-secondary text-sm mb-10">Please enter your details to sign in.</p>
          {errorMsg && <p className="text-red-500 text-sm text-center mb-4">{errorMsg}</p>}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-2">Email</label>
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white border-none rounded-lg px-4 py-3 text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent-blue/20 transition-all placeholder:text-text-muted shadow-sm"
                  placeholder="Enter your email"
                />
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-xs font-semibold text-text-secondary">Password</label>
                  <a href="#" className="text-xs font-medium text-accent-blue hover:underline">Forgot password?</a>
                </div>
                <input 
                  type="password" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white border-none rounded-lg px-4 py-3 text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent-blue/20 transition-all placeholder:text-text-muted tracking-widest shadow-sm"
                  placeholder="••••••••"
                />
              </div>
              <button type="submit" className="w-full bg-gradient-to-r from-accent-blue to-accent-purple text-[#FAFAFA] font-bold py-3.5 rounded-lg mt-4 hover:opacity-90 transition-opacity shadow-md">
                Sign In
              </button>
            </form>

          <p className="text-center text-sm text-text-secondary mt-10 font-medium">
            Don't have an account? <Link to="/signup" className="text-text-primary font-semibold hover:text-accent-blue transition-colors">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;




