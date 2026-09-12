import React from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';

function ArticleDetail() {
  const { id: _id } = useParams();
  const navigate = useNavigate();

  return (
    <div className="min-h-dvh bg-bg-primary text-text-primary flex font-sans">
      {/* Sidebar - Same as Dashboard (simplified for brevity) */}
      <aside className="w-64 border-r border-border-subtle bg-bg-primary hidden md:flex flex-col sticky top-0 h-dvh">
        <div className="p-6">
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-blue to-accent-purple flex items-center justify-center">
              <span className="text-[#FAFAFA] font-bold text-lg leading-none">T</span>
            </div>
            <span className="text-xl font-bold tracking-tight text-text-primary">TechPulse</span>
          </Link>
        </div>
        <nav className="flex-1 px-4 py-4 space-y-1">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors mb-4">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
            Back to Feed
          </button>
          <div className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2 px-3">Menu</div>
          <Link to="/dashboard" className="flex items-center px-3 py-2 rounded-lg text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-bg-card transition-colors">Home</Link>
          <Link to="#" className="flex items-center px-3 py-2 rounded-lg text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-bg-card transition-colors">For You</Link>
          <Link to="#" className="flex items-center px-3 py-2 rounded-lg text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-bg-card transition-colors">Trending</Link>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-dvh">
        <header className="h-16 border-b border-border-subtle bg-bg-primary/80 backdrop-blur-md sticky top-0 z-40 px-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
             <button onClick={() => navigate(-1)} className="md:hidden text-text-secondary">
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
             </button>
             <span className="text-sm font-medium text-text-muted">Article Detail</span>
          </div>
          <div className="flex items-center gap-4">
            <button className="w-8 h-8 rounded-full bg-bg-card-elevated flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-border-subtle transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"></path></svg>
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-auto">
          <article className="max-w-4xl mx-auto p-6 md:p-12">
            {/* Meta */}
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-bg-card-elevated flex items-center justify-center text-xs font-bold text-text-primary border border-border-subtle">
                  T
                </div>
                <span className="text-sm font-bold text-text-primary">TechCrunch</span>
              </div>
              <span className="text-text-muted text-sm">•</span>
              <span className="text-text-secondary text-sm">2 hours ago</span>
              <span className="text-text-muted text-sm">•</span>
              <span className="px-2 py-0.5 rounded bg-accent-blue/10 text-xs text-accent-blue font-semibold border border-accent-blue/20">AI</span>
            </div>

            <h1 className="text-3xl md:text-5xl font-bold text-text-primary mb-6 leading-tight">
              OpenAI announces new agentic reasoning model for developers
            </h1>

            {/* Hero Image placeholder */}
            <div className="w-full aspect-video bg-bg-card-elevated rounded-2xl border border-border-subtle mb-10 flex items-center justify-center relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-tr from-accent-blue/20 to-accent-purple/20 opacity-50 group-hover:opacity-100 transition-opacity"></div>
              <svg className="w-12 h-12 text-text-muted relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
            </div>

            {/* Smart Summary */}
            <div className="bg-bg-card border-l-4 border-accent-blue p-6 rounded-r-xl mb-10">
              <h3 className="flex items-center gap-2 text-text-primary font-bold mb-4">
                <svg className="w-5 h-5 text-accent-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                Smart Summary
              </h3>
              <ul className="space-y-3 text-text-secondary">
                <li className="flex items-start gap-3">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-accent-blue shrink-0"></span>
                  OpenAI has released a new API specifically designed for multi-step agentic workflows.
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-accent-blue shrink-0"></span>
                  The model can autonomously plan, execute tools, and correct its own mistakes without human intervention.
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-accent-blue shrink-0"></span>
                  Pricing is substantially lower than GPT-4 for high-volume background tasks.
                </li>
              </ul>
            </div>

            {/* Original content placeholder */}
            <div className="prose prose-invert max-w-none text-text-secondary leading-relaxed mb-10 space-y-6 text-lg">
              <p>
                In a major update to its developer platform, OpenAI today introduced a new class of models optimized specifically for agentic reasoning and long-running autonomous tasks.
              </p>
              <p>
                Unlike previous iterative models that require strict user prompting for every step, the new architecture allows developers to pass a high-level goal and a set of available API tools. The model will internally plan a multi-step approach, execute the tools, read the responses, and dynamically adjust its strategy if a tool fails.
              </p>
            </div>

            {/* Read Original CTA */}
            <div className="flex justify-center mb-16">
              <a href="#" className="inline-flex items-center gap-2 bg-accent-blue text-[#FAFAFA] font-bold px-8 py-4 rounded-full hover:bg-gray-200 transition-colors">
                Read Original Article
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
              </a>
            </div>

            {/* Covered by multiple sources */}
            <div className="border-t border-border-subtle pt-10">
              <h3 className="text-xl font-bold text-text-primary mb-6">Covered by multiple sources</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { s: 'The Verge', t: 'OpenAI\'s new agent model wants to do your job for you' },
                  { s: 'WIRED', t: 'The era of autonomous AI agents begins with OpenAI\'s latest release' }
                ].map((related, i) => (
                  <div key={i} className="bg-bg-card border border-border-subtle p-5 rounded-xl hover:border-text-muted transition-colors cursor-pointer group">
                    <div className="text-xs font-medium text-text-muted mb-2">{related.s}</div>
                    <div className="text-sm font-medium text-text-secondary group-hover:text-text-primary transition-colors">{related.t}</div>
                  </div>
                ))}
              </div>
            </div>

          </article>
        </div>
      </main>
    </div>
  );
}

export default ArticleDetail;
