import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../store/authSlice';
import { fetchFeed } from '../store/feedSlice';
import LogoutModal from '../components/LogoutModal';
import api from '../api/api';

function timeAgo(dateString) {
  const date = new Date(dateString);
  const seconds = Math.floor((new Date() - date) / 1000);
  
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + " years ago";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + " months ago";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + " days ago";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + " hours ago";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + " minutes ago";
  return Math.floor(seconds) + " seconds ago";
}

const htmlParser = new DOMParser();
const stripHtml = (html) => {
  if (!html) return "";
  let text = html;
  let previous = "";
  
  // Handle double or triple escaped HTML (common in some RSS feeds)
  for (let i = 0; i < 3; i++) {
    // Unescape HTML entities
    text = htmlParser.parseFromString(text, 'text/html').body.textContent || "";
    // Remove any newly unescaped tags
    text = text.replace(/<[^>]+>/g, '');
    if (text === previous) break;
    previous = text;
  }
  
  return text;
};

function Dashboard() {
  const [activeFilter, setActiveFilter] = useState('All');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');
  
  const [categories, setCategories] = useState(['All']);
  
  const [searchQuery, setSearchQuery] = useState('');
  
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const { articles, status } = useSelector((state) => state.feed);

  const handleSyncNow = async () => {
    setIsSyncing(true);
    setSyncMessage('');
    try {
      await api.post('/feed/sync-now/');
      setSyncMessage('Sync started! Your feed will update shortly.');
      // Refresh feed after a short delay allowing background task to process
      setTimeout(() => {
        dispatch(fetchFeed());
        setSyncMessage('');
      }, 5000);
    } catch (error) {
      console.error("Error triggering sync", error);
      setSyncMessage('Failed to trigger sync.');
      setTimeout(() => setSyncMessage(''), 3000);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    dispatch(fetchFeed());
    api.get('/preferences/').then(res => {
      if (res.data && res.data.categories) {
        setCategories(['All', ...res.data.categories]);
      }
    }).catch(err => console.error("Error fetching preferences", err));
  }, [dispatch]);

  const handleLogout = () => {
    setIsLogoutModalOpen(true);
  };

  const confirmLogout = () => {
    dispatch(logout());
    navigate('/');
  };

  const filteredArticles = articles.filter(article => {
    const matchesFilter = activeFilter === 'All' || article.category_name === activeFilter;
    const matchesSearch = !searchQuery || 
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (article.summary && stripHtml(article.summary).toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary flex font-sans">
      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <aside className={`w-64 border-r border-border-subtle bg-bg-primary flex flex-col fixed md:sticky top-0 h-screen z-50 transition-transform duration-300 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="p-6 flex justify-between items-center">
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-blue to-accent-purple flex items-center justify-center">
              <span className="text-[#FAFAFA] font-bold text-lg leading-none">T</span>
            </div>
            <span className="text-xl font-bold tracking-tight text-text-primary">TechPulse</span>
          </Link>
          <button onClick={() => setMobileMenuOpen(false)} className="md:hidden text-text-secondary">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          <div className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2 px-3">Menu</div>
          <Link to="/dashboard" className="flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors bg-bg-card-elevated text-text-primary">
            Home
          </Link>
          
          <div className="text-xs font-bold text-text-muted uppercase tracking-wider mt-8 mb-2 px-3">Library</div>
          <Link to="/sources" className="flex items-center px-3 py-2 rounded-lg text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-bg-card transition-colors">
            Sources
          </Link>
        </nav>

        <div className="p-4 border-t border-border-subtle">
          <Link to="/settings" className="flex items-center px-3 py-2 rounded-lg text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-bg-card transition-colors">
            Settings
          </Link>
          <button onClick={handleLogout} className="w-full text-left flex items-center px-3 py-2 rounded-lg text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-bg-card transition-colors">
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen">
        {/* Topbar */}
        <header className="h-16 border-b border-border-subtle bg-bg-primary/80 backdrop-blur-md sticky top-0 z-40 px-4 md:px-6 flex items-center justify-between gap-4">
          <button onClick={() => setMobileMenuOpen(true)} className="md:hidden text-text-secondary hover:text-text-primary">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
          </button>
          
          <div className="flex-1 max-w-xl relative hidden sm:block">
            <svg className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search technology news..." 
              className="w-full bg-bg-card border border-border-subtle rounded-full py-2 pl-10 pr-4 text-sm text-text-primary focus:outline-none focus:border-accent-blue transition-colors"
            />
          </div>
          <div className="flex items-center gap-4 ml-4">
            <button className="text-text-secondary hover:text-text-primary transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
            </button>
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-accent-cyan to-accent-blue cursor-pointer ring-2 ring-border-subtle"></div>
          </div>
        </header>

        <div className="flex-1 overflow-auto">
          <div className="max-w-4xl mx-auto p-6 md:p-8">
            <div className="mb-8 flex justify-between items-end">
              <div>
                <h1 className="text-3xl font-bold text-text-primary mb-2">Good evening.</h1>
                <p className="text-text-secondary text-lg">Here's what's happening in tech today.</p>
              </div>
              <div className="flex flex-col items-end">
                {syncMessage && <span className={`text-sm mb-2 ${syncMessage.includes('Failed') ? 'text-red-500' : 'text-accent-blue'}`}>{syncMessage}</span>}
                <button 
                  onClick={handleSyncNow}
                  disabled={isSyncing}
                  className="flex items-center gap-2 px-4 py-2 bg-bg-card-elevated hover:bg-bg-card border border-border-subtle rounded-lg text-sm font-medium text-text-primary transition-colors disabled:opacity-50"
                >
                  <svg className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                  {isSyncing ? 'Syncing...' : 'Sync Now'}
                </button>
              </div>
            </div>

            {/* Filter Controls */}
            <div className="flex items-center gap-3 overflow-x-auto pb-4 mb-6 scrollbar-hide">
              <span className="text-sm font-bold text-text-primary mr-2">Your Feed</span>
              {categories.map(filter => (
                <button 
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                    activeFilter === filter 
                      ? 'bg-accent-blue text-[#FAFAFA]' 
                      : 'bg-bg-card border border-border-subtle text-text-secondary hover:text-text-primary hover:border-text-muted'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-6">
              {/* News Feed */}
              {status === 'loading' && <p className="text-text-secondary">Loading your feed...</p>}
              {status === 'failed' && <p className="text-accent-purple">Failed to load feed.</p>}
              
              {status === 'succeeded' && filteredArticles.length === 0 && (
                <p className="text-text-secondary">No articles found for this category.</p>
              )}

              {status === 'succeeded' && filteredArticles.map(article => {
                const summaryText = stripHtml(article.summary).trim();
                // Hide summary if it's empty or just says 'Comments', 'Read More', etc.
                const showSummary = summaryText && !/^(comments?|read more|article)$/i.test(summaryText);
                
                return (
                <div key={article.id} className="bg-bg-card border border-border-subtle rounded-2xl overflow-hidden flex flex-col hover:border-border-subtle/80 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/50 transition-all duration-300 group">
                  <div className="p-6 flex flex-col h-full">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded bg-bg-card-elevated flex items-center justify-center text-xs font-bold text-text-primary border border-border-subtle">
                          {article.source_names[0]?.charAt(0) || '?'}
                        </div>
                        <span className="text-sm font-medium text-text-secondary">
                          {article.source_names[0]} • {timeAgo(article.publication_date)}
                        </span>
                      </div>
                      <a href={article.url} target="_blank" rel="noopener noreferrer" className="text-text-muted hover:text-text-primary transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                      </a>
                    </div>
                    
                    <a href={article.url} target="_blank" rel="noopener noreferrer" className="block group-hover:text-accent-blue transition-colors">
                      <h2 className="text-xl md:text-2xl font-bold text-text-primary mb-3 leading-snug">{article.title}</h2>
                    </a>
                    
                    {showSummary && (
                      <p className="text-text-secondary mb-4 leading-relaxed line-clamp-3">
                        {summaryText}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-2 flex-wrap mt-auto">
                      <span className="px-2.5 py-1 rounded bg-bg-card-elevated border border-border-subtle text-xs font-medium text-text-secondary">
                        {article.category_name}
                      </span>
                      
                      {/* Display multiple sources if consolidated */}
                      {article.source_names.length > 1 && (
                        <span className="ml-auto text-xs font-medium text-accent-blue">
                          Also reported by: {article.source_names.slice(1).join(', ')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )})}
            </div>
          </div>
        </div>
      </main>
      
      <LogoutModal 
        isOpen={isLogoutModalOpen} 
        onClose={() => setIsLogoutModalOpen(false)} 
        onConfirm={confirmLogout} 
      />
    </div>
  );
}

export default Dashboard;
