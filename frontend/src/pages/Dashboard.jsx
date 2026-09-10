import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../store/authSlice';
import { fetchFeed } from '../store/feedSlice';
import LogoutModal from '../components/LogoutModal';
import Layout from '../components/Layout';
import SkeletonCard from '../components/SkeletonCard';
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
  }
  
  return text;
};

function Dashboard() {
  const [activeFilter, setActiveFilter] = useState('All');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');
  
  const [categories, setCategories] = useState(['All']);
  
  const [searchQuery, setSearchQuery] = useState('');
  
  const dispatch = useDispatch();
  
  const { articles, status, hasMore, currentPage } = useSelector((state) => state.feed);

  const observer = useRef();
  const lastArticleElementRef = useCallback(node => {
    if (status === 'loading') return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        dispatch(fetchFeed(currentPage + 1));
      }
    });
    if (node) observer.current.observe(node);
  }, [status, hasMore, currentPage, dispatch]);

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

  const filteredArticles = articles.filter(article => {
    const matchesFilter = activeFilter === 'All' || article.category_name === activeFilter;
    const matchesSearch = !searchQuery || 
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (article.summary && stripHtml(article.summary).toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  return (
    <Layout searchProps={{ value: searchQuery, onChange: (e) => setSearchQuery(e.target.value) }}>
      <div className="w-full max-w-[1600px] mx-auto p-6 md:p-8">
        <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h1 className="text-2xl font-bold text-text-primary mb-1">
              {new Date().getHours() < 12 ? 'Good morning.' : new Date().getHours() < 18 ? 'Good afternoon.' : 'Good evening.'}
            </h1>
            <h2 className="text-base font-medium text-text-secondary">
              Your Intelligence Hub. <span className="text-text-muted font-normal">(All the news you care about. In one place.)</span>
            </h2>
          </div>
          <div className="flex flex-col items-start md:items-end w-full md:w-auto">
            {syncMessage && <span className={`text-sm mb-2 ${syncMessage.includes('Failed') ? 'text-red-500' : 'text-accent-blue'}`}>{syncMessage}</span>}
            <button 
              onClick={handleSyncNow}
              disabled={isSyncing}
              className="flex items-center gap-2 px-4 py-2 bg-bg-card hover:bg-bg-secondary border border-border-subtle rounded-lg text-sm font-medium text-text-primary transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow active:scale-95"
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
                  ? 'bg-text-primary text-bg-primary shadow-sm' 
                  : 'bg-bg-card border border-border-subtle text-text-secondary hover:text-text-primary hover:border-border-subtle hover:bg-bg-secondary'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 auto-rows-[minmax(200px,auto)]">
          {/* News Feed */}
          {status === 'failed' && <p className="text-accent-purple col-span-full">Failed to load feed.</p>}
          
          {status !== 'loading' && filteredArticles.length === 0 && (
            <p className="text-text-secondary col-span-full">No articles found for this category.</p>
          )}

          {filteredArticles.map((article, index) => {
            const summaryText = stripHtml(article.summary).trim();
            const showSummary = summaryText && !/^(comments?|read more|article)$/i.test(summaryText);
            
            // Bento layout logic matching the screenshot
            let gridSpan = 'col-span-1 row-span-1';
            if (index % 5 === 0) gridSpan = 'col-span-1 md:col-span-1 lg:col-span-1 row-span-2';
            else if (index % 5 === 1) gridSpan = 'col-span-1 md:col-span-2 lg:col-span-2 row-span-1';
            else if (index % 5 === 2) gridSpan = 'col-span-1 md:col-span-1 lg:col-span-1 row-span-1';
            else if (index % 5 === 3) gridSpan = 'col-span-1 md:col-span-2 lg:col-span-2 row-span-1';
            else if (index % 5 === 4) gridSpan = 'col-span-1 md:col-span-1 lg:col-span-1 row-span-1';

            return (
            <div 
              ref={index === filteredArticles.length - 1 ? lastArticleElementRef : null}
              key={article.id} 
              className={`bg-bg-card border border-border-subtle rounded-2xl overflow-hidden flex flex-col hover:border-border-subtle hover:-translate-y-1 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300 group cursor-pointer min-h-[220px] ${gridSpan}`}
            >
              <div className="p-6 flex flex-col h-full relative">
                <div className="w-6 h-6 rounded-md bg-border-subtle mb-4"></div>
                
                <a href={article.url} target="_blank" rel="noopener noreferrer" className="block group-hover:text-accent-blue transition-colors mt-2">
                  <h2 className="text-lg font-bold text-text-primary mb-3 leading-snug line-clamp-3">{article.title}</h2>
                </a>
                
                {showSummary && (
                  <p className="text-text-secondary text-sm mb-6 leading-relaxed line-clamp-3">
                    {summaryText}
                  </p>
                )}
                
                <div className="flex items-center gap-2 mt-auto text-xs font-medium text-text-muted">
                  <span className="px-2.5 py-1 rounded bg-bg-card-elevated border border-border-subtle text-text-secondary">
                    {article.category_name}
                  </span>
                  <span className="ml-2">
                    Source: {article.source_names[0]} • {timeAgo(article.publication_date)}
                  </span>
                </div>
              </div>
            </div>
          )})}

          {status === 'loading' && Array.from({ length: 10 }).map((_, index) => {
            const actualIndex = filteredArticles.length + index;
            let gridSpan = 'col-span-1 row-span-1';
            if (actualIndex % 5 === 0) gridSpan = 'col-span-1 md:col-span-1 lg:col-span-1 row-span-2';
            else if (actualIndex % 5 === 1) gridSpan = 'col-span-1 md:col-span-2 lg:col-span-2 row-span-1';
            else if (actualIndex % 5 === 2) gridSpan = 'col-span-1 md:col-span-1 lg:col-span-1 row-span-1';
            else if (actualIndex % 5 === 3) gridSpan = 'col-span-1 md:col-span-2 lg:col-span-2 row-span-1';
            else if (actualIndex % 5 === 4) gridSpan = 'col-span-1 md:col-span-1 lg:col-span-1 row-span-1';
            return <SkeletonCard key={`skeleton-${index}`} gridSpan={gridSpan} />;
          })}
        </div>
      </div>
    </Layout>
  );
}

export default Dashboard;
