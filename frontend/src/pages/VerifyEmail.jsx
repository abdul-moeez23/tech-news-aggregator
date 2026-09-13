import React, { useEffect, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import api from '../api/api';

export default function VerifyEmail() {
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');

    if (!token) {
      setStatus('error');
      setMessage('No verification token found in the URL.');
      return;
    }

    const verifyToken = async () => {
      try {
        const response = await api.post('/auth/verify-email/', { token });
        setStatus('success');
        setMessage(response.data.message || 'Your email has been successfully verified.');
      } catch (err) {
        setStatus('error');
        setMessage(err.response?.data?.error || 'Failed to verify email. The link may have expired or is invalid.');
      }
    };

    verifyToken();
  }, [location]);

  return (
    <div className="h-dvh overflow-hidden flex flex-col md:flex-row font-sans bg-bg-primary">
      {/* Left Panel - Dark Petrol Background */}
      <div className="hidden md:flex md:w-[55%] bg-accent-blue flex-col justify-between p-8 lg:p-12 relative overflow-y-auto h-full">
        {/* Subtle background glow/overlay if needed */}
        <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-white/5 to-transparent pointer-events-none"></div>
        
        {/* Top: Header */}
        <div className="relative z-10 flex justify-between items-center w-full">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 inline-flex">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-blue to-accent-purple flex items-center justify-center shadow-lg">
              <span className="text-[#FAFAFA] font-bold text-lg leading-none">T</span>
            </div>
            <span className="text-xl font-bold tracking-tight text-white">TechPulse</span>
          </Link>
          
          {/* Back to Home */}
          <Link to="/" className="inline-flex items-center gap-1.5 px-3 py-1.5 lg:px-4 lg:py-2 bg-white text-text-primary font-semibold rounded-full hover:bg-gray-100 transition-colors text-xs lg:text-sm">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
            Back to Home
          </Link>
        </div>

        {/* Middle: Content */}
        <div className="relative z-10 flex flex-col items-center justify-center flex-1 my-2 xl:my-8 w-full">
          <div className="max-w-xl w-full mx-auto flex flex-col gap-4 xl:gap-8">
            {/* Heading */}
            <div className="w-full">
              <h1 className="text-3xl lg:text-4xl 2xl:text-5xl font-bold tracking-tight leading-[1.1] text-white">
                Verifying your account.<br />
                <span className="text-transparent" style={{ WebkitTextStroke: '1px rgba(255,255,255,0.2)' }}>Almost there.</span>
              </h1>
            </div>

            {/* Dashboard Preview Cards - Full Width */}
            <div className="w-full flex flex-col gap-2 xl:gap-3 relative z-10 opacity-80">
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

        {/* Bottom Spacer */}
        <div className="relative z-10"></div>
      </div>

      {/* Right Panel - Content */}
      <div className="flex-1 flex items-center justify-center p-6 bg-bg-secondary h-full overflow-y-auto">
        <div className="w-full max-w-[360px] flex flex-col justify-center">
          
          <div className="flex justify-between items-center mb-10 md:hidden w-full absolute top-0 left-0 p-6">
            <Link to="/" className="p-2 -ml-2 rounded-full hover:bg-bg-card-elevated text-text-secondary">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
            </Link>
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-blue to-accent-purple flex items-center justify-center">
                <span className="text-[#FAFAFA] font-bold text-lg leading-none">T</span>
              </div>
              <span className="text-xl font-bold tracking-tight text-text-primary">TechPulse</span>
            </Link>
            <div className="w-9"></div>
          </div>
          <div className="mt-12 md:mt-0"></div>

          {status === 'loading' && (
            <div className="flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-accent-blue/10 rounded-full flex items-center justify-center mb-6 animate-pulse">
                <svg className="w-8 h-8 text-accent-blue animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-text-primary mb-2">Verifying...</h2>
              <p className="text-text-secondary text-sm">Please wait while we verify your email address.</p>
            </div>
          )}

          {status === 'success' && (
            <div className="flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-text-primary mb-2">Email Verified!</h2>
              <p className="text-text-secondary text-sm mb-8">
                {message}
              </p>
              <Link 
                to="/login"
                className="w-full bg-gradient-to-r from-accent-blue to-accent-purple text-[#FAFAFA] font-bold py-3.5 rounded-lg hover:opacity-90 transition-opacity shadow-md text-center"
              >
                Log in to continue
              </Link>
            </div>
          )}

          {status === 'error' && (
            <div className="flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-text-primary mb-2">Verification Failed</h2>
              <p className="text-red-500 text-sm mb-8">
                {message}
              </p>
              <Link 
                to="/signup"
                className="w-full bg-white border border-gray-200 text-text-primary font-bold py-3.5 rounded-lg hover:bg-gray-50 transition-colors shadow-sm text-center"
              >
                Back to Sign up
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
