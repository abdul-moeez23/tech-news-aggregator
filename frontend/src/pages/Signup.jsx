import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/api';

function Signup() {
  const [email, setEmail]                   = useState('');
  const [password, setPassword]             = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword]     = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMsg, setErrorMsg]             = useState('');
  const [isSuccess, setIsSuccess]           = useState(false);
  const [isLoading, setIsLoading]           = useState(false);

  // Cooldown state — seconds remaining before user can submit again
  const [cooldown, setCooldown]             = useState(0);
  const [isRateLimited, setIsRateLimited]   = useState(false);

  // Resend state (on the success screen)
  const [resendLoading, setResendLoading]   = useState(false);
  const [resendMsg, setResendMsg]           = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  const timerRef       = useRef(null);
  const resendTimerRef = useRef(null);

  // ── Countdown tick for signup cooldown ───────────────────────────────────
  useEffect(() => {
    if (cooldown <= 0) { setIsRateLimited(false); return; }
    timerRef.current = setInterval(() => {
      setCooldown(prev => {
        if (prev <= 1) { clearInterval(timerRef.current); setIsRateLimited(false); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [cooldown]);

  // ── Countdown tick for resend cooldown ───────────────────────────────────
  useEffect(() => {
    if (resendCooldown <= 0) return;
    resendTimerRef.current = setInterval(() => {
      setResendCooldown(prev => {
        if (prev <= 1) { clearInterval(resendTimerRef.current); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(resendTimerRef.current);
  }, [resendCooldown]);

  // ── Handle signup submit ─────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) { setErrorMsg('Passwords do not match!'); return; }

    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await api.post('/auth/register/', {
        username: email,
        email,
        password,
      });

      const status = res.status;

      if (status === 201) {
        // Brand-new account created
        setIsSuccess(true);
      } else if (status === 200) {
        // Unverified email — resend success
        setIsSuccess(true);
      }
    } catch (err) {
      const data   = err.response?.data;
      const status = err.response?.status;

      if (status === 429) {
        // Rate limited — start countdown
        const waitSecs = data?.retry_after_seconds || 60;
        setIsRateLimited(true);
        setCooldown(waitSecs);
        setErrorMsg(data?.error || `Please wait ${waitSecs}s before trying again.`);
      } else if (status === 409) {
        // Email already verified
        setErrorMsg(data?.error || 'Email already registered. Please log in.');
      } else if (data) {
        const key = Object.keys(data)[0];
        const raw = key ? (Array.isArray(data[key]) ? data[key][0] : data[key]) : null;
        // Guard against HTML error pages returned as strings (e.g. Django 500 pages)
        const msg = (typeof raw === 'string' && !raw.trim().startsWith('<'))
          ? raw
          : 'Registration failed. Please try again.';
        setErrorMsg(msg);
      } else {
        setErrorMsg('Registration failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // ── Handle resend from success screen ───────────────────────────────────
  const handleResend = async () => {
    if (resendCooldown > 0 || resendLoading) return;
    setResendLoading(true);
    setResendMsg('');

    try {
      await api.post('/auth/resend-verification/', { email });
      setResendMsg('Verification email resent! Check your inbox.');
      setResendCooldown(60); // start 60s cooldown after resend
    } catch (err) {
      const data   = err.response?.data;
      const status = err.response?.status;
      if (status === 429) {
        const waitSecs = data?.retry_after_seconds || 60;
        setResendCooldown(waitSecs);
        setResendMsg(data?.error || `Please wait ${waitSecs}s before resending.`);
      } else {
        setResendMsg('Failed to resend. Please try again.');
      }
    } finally {
      setResendLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="h-dvh overflow-hidden flex flex-col md:flex-row font-sans bg-bg-primary">
      {/* Left Panel */}
      <div className="hidden md:flex md:w-[55%] bg-accent-blue flex-col justify-between p-8 lg:p-12 relative overflow-y-auto h-full">
        <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />

        {/* Header */}
        <div className="relative z-10 flex justify-between items-center w-full">
          <Link to="/" className="flex items-center gap-2 inline-flex">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-blue to-accent-purple flex items-center justify-center shadow-lg">
              <span className="text-[#FAFAFA] font-bold text-lg leading-none">T</span>
            </div>
            <span className="text-xl font-bold tracking-tight text-white">TechPulse</span>
          </Link>
          <Link to="/" className="inline-flex items-center gap-1.5 px-3 py-1.5 lg:px-4 lg:py-2 bg-white text-text-primary font-semibold rounded-full hover:bg-gray-100 transition-colors text-xs lg:text-sm">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Back to Home
          </Link>
        </div>

        {/* Middle */}
        <div className="relative z-10 flex flex-col items-center justify-center flex-1 my-2 xl:my-8 w-full">
          <div className="max-w-xl w-full mx-auto flex flex-col gap-4 xl:gap-8">
            <div className="w-full">
              <h1 className="text-3xl lg:text-4xl 2xl:text-5xl font-bold tracking-tight leading-[1.1] text-white">
                Join the smartest<br />tech news platform.<br />
                <span className="text-transparent" style={{ WebkitTextStroke: '1px rgba(255,255,255,0.2)' }}>Signal, not noise.</span>
              </h1>
            </div>
            <div className="w-full flex flex-col gap-2 xl:gap-3 relative z-10 opacity-80">
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-accent-blue pointer-events-none z-20" />
              {[
                { source: 'TechCrunch - 2h ago', headline: "Mank Crunch - Startups: The'news banfest the latest continuen-rinming technology stories, marketing" },
                { source: 'TechCrunch - 2h ago', headline: 'AewCrunch conwensed the AI to grow: henxr markets in Technology:' },
                { source: 'TechCrunch - 2h ago', headline: 'AI deepezt.estaman new straakout: Technology our production' },
              ].map((card, i) => (
                <div key={i} className={`bg-white/5 border border-white/10 p-3 xl:p-4 rounded-xl backdrop-blur-sm shadow-lg relative z-10 ${i === 2 ? 'hidden lg:block' : ''}`}>
                  <div className="flex items-center gap-2 mb-1 xl:mb-2">
                    <div className="w-3 h-3 xl:w-4 xl:h-4 rounded bg-white/10" />
                    <span className="text-[10px] xl:text-xs text-white/70 font-medium">{card.source}</span>
                  </div>
                  <h3 className="text-xs xl:text-sm font-medium text-white/90 leading-relaxed mb-2 xl:mb-3 pr-2 line-clamp-2">{card.headline}</h3>
                  <div className="flex gap-2">
                    <span className="px-2 py-0.5 xl:py-1 rounded bg-white/10 text-[9px] xl:text-[10px] text-white/80 font-medium border border-white/5">AI</span>
                    <span className="px-2 py-0.5 xl:py-1 rounded bg-white/10 text-[9px] xl:text-[10px] text-white/80 font-medium border border-white/5">Startups</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="relative z-10" />
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center p-6 bg-bg-secondary h-full overflow-y-auto">
        <div className="w-full max-w-[360px] flex flex-col justify-center">

          {/* Mobile header */}
          <div className="flex justify-between items-center mb-10 md:hidden w-full absolute top-0 left-0 p-6">
            <Link to="/" className="p-2 -ml-2 rounded-full hover:bg-bg-card-elevated text-text-secondary">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            </Link>
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-blue to-accent-purple flex items-center justify-center">
                <span className="text-[#FAFAFA] font-bold text-lg leading-none">T</span>
              </div>
              <span className="text-xl font-bold tracking-tight text-text-primary">TechPulse</span>
            </Link>
            <div className="w-9" />
          </div>
          <div className="mt-12 md:mt-0" />

          {/* ── Success screen ── */}
          {isSuccess ? (
            <div className="flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-accent-blue/10 rounded-full flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-accent-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-text-primary mb-2">Check your email</h2>
              <p className="text-text-secondary text-sm mb-2">
                We've sent a verification link to{' '}
                <span className="font-semibold text-text-primary">{email}</span>.{' '}
                Please verify your email before continuing.
              </p>

              {/* Resend feedback */}
              {resendMsg && (
                <p className={`text-xs mb-3 ${resendMsg.includes('resent') ? 'text-green-500' : 'text-amber-500'}`}>
                  {resendMsg}
                </p>
              )}

              {/* Resend button with cooldown */}
              <button
                onClick={handleResend}
                disabled={resendCooldown > 0 || resendLoading}
                className="w-full mb-4 py-3 rounded-lg border border-border text-sm font-semibold text-text-secondary
                           hover:bg-bg-card-elevated transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                           flex items-center justify-center gap-2"
              >
                {resendLoading ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Sending...
                  </>
                ) : resendCooldown > 0 ? (
                  <>
                    {/* Circular countdown ring */}
                    <svg className="w-4 h-4" viewBox="0 0 36 36">
                      <circle cx="18" cy="18" r="15.9" fill="none" stroke="currentColor" strokeWidth="3" opacity="0.2" />
                      <circle
                        cx="18" cy="18" r="15.9" fill="none" stroke="currentColor" strokeWidth="3"
                        strokeDasharray={`${(resendCooldown / 60) * 100} 100`}
                        strokeLinecap="round"
                        transform="rotate(-90 18 18)"
                      />
                    </svg>
                    Resend in {resendCooldown}s
                  </>
                ) : (
                  'Resend verification email'
                )}
              </button>

              <Link
                to="/login"
                className="w-full bg-gradient-to-r from-accent-blue to-accent-purple text-[#FAFAFA] font-bold py-3.5 rounded-lg hover:opacity-90 transition-opacity shadow-md text-center"
              >
                Go to Login
              </Link>
            </div>

          ) : (
            /* ── Signup form ── */
            <>
              <h2 className="text-3xl font-bold text-center text-text-primary mb-2">Create an account</h2>
              <p className="text-center text-text-secondary text-sm mb-10">Join the smartest tech news platform.</p>

              {/* Error message */}
              {errorMsg && (
                <div className={`mb-4 px-4 py-3 rounded-lg text-sm text-center ${isRateLimited ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
                  {errorMsg}
                  {/* Cooldown progress bar */}
                  {isRateLimited && cooldown > 0 && (
                    <div className="mt-2 w-full bg-amber-500/20 rounded-full h-1.5">
                      <div
                        className="bg-amber-500 h-1.5 rounded-full transition-all duration-1000"
                        style={{ width: `${(cooldown / 60) * 100}%` }}
                      />
                    </div>
                  )}
                </div>
              )}

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
                    disabled={isLoading || isRateLimited}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-2">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={`w-full bg-white border-none rounded-lg pl-4 pr-10 py-3 text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent-blue/20 transition-all placeholder:text-text-muted shadow-sm ${!showPassword ? 'tracking-widest' : ''}`}
                      placeholder="••••••••"
                      disabled={isLoading || isRateLimited}
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-text-muted hover:text-text-primary transition-colors focus:outline-none">
                      {showPassword ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                      )}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-2">Confirm Password</label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={`w-full bg-white border-none rounded-lg pl-4 pr-10 py-3 text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent-blue/20 transition-all placeholder:text-text-muted shadow-sm ${!showConfirmPassword ? 'tracking-widest' : ''}`}
                      placeholder="••••••••"
                      disabled={isLoading || isRateLimited}
                    />
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-text-muted hover:text-text-primary transition-colors focus:outline-none">
                      {showConfirmPassword ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* Submit button — disabled during loading OR cooldown */}
                <button
                  type="submit"
                  disabled={isLoading || isRateLimited}
                  className="w-full bg-gradient-to-r from-accent-blue to-accent-purple text-[#FAFAFA] font-bold py-3.5 rounded-lg mt-4 hover:opacity-90 transition-opacity shadow-md disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Creating...
                    </>
                  ) : isRateLimited ? (
                    `Wait ${cooldown}s`
                  ) : (
                    'Create Account'
                  )}
                </button>
              </form>
            </>
          )}

          {!isSuccess && (
            <p className="text-center text-sm text-text-secondary mt-10 font-medium">
              Already have an account?{' '}
              <Link to="/login" className="text-text-primary font-semibold hover:text-accent-blue transition-colors">Log in</Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default Signup;
