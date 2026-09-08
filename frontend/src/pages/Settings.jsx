import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { logout } from '../store/authSlice';
import api from '../api/api';
import LogoutModal from '../components/LogoutModal';

export default function Settings() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [availableCategories, setAvailableCategories] = useState([]);
  const [availableSources, setAvailableSources] = useState([]);
  
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [freshness, setFreshness] = useState('3');
  const [selectedSources, setSelectedSources] = useState([]);
  
  const [autoFetch, setAutoFetch] = useState(true);
  const [fetchFrequency, setFetchFrequency] = useState('60');
  
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catRes, srcRes, prefRes] = await Promise.all([
          api.get('/categories/'),
          api.get('/sources/'),
          api.get('/preferences/')
        ]);
        
        setAvailableCategories(catRes.data.map(c => c.name));
        setAvailableSources(srcRes.data);
        
        setSelectedCategories(prefRes.data.categories || []);
        setSelectedSources(prefRes.data.sources || []);
        setFreshness(prefRes.data.freshness_days?.toString() || '3');
        setAutoFetch(prefRes.data.auto_fetch !== undefined ? prefRes.data.auto_fetch : true);
        setFetchFrequency(prefRes.data.fetch_frequency?.toString() || '60');
      } catch (error) {
        console.error("Error fetching settings data", error);
        setMessage('Failed to load settings data.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const handleLogout = () => {
    setIsLogoutModalOpen(true);
  };

  const confirmLogout = () => {
    dispatch(logout());
    navigate('/');
  };

  const handleCategoryToggle = (category) => {
    setSelectedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const handleSourceToggle = (source) => {
    setSelectedSources(prev => 
      prev.includes(source) 
        ? prev.filter(s => s !== source)
        : [...prev, source]
    );
  };

  const handleSave = async () => {
    try {
      await api.put('/preferences/', { 
        categories: selectedCategories, 
        sources: selectedSources, 
        freshness_days: parseInt(freshness),
        auto_fetch: autoFetch,
        fetch_frequency: parseInt(fetchFrequency)
      });
      setMessage('Preferences saved successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error(error);
      setMessage('Error saving preferences.');
    }
  };

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
        <div className="p-4 flex justify-between items-center">
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-blue to-accent-purple flex items-center justify-center">
              <span className="text-[#FAFAFA] font-bold text-lg leading-none">T</span>
            </div>
            <span className="text-xl font-bold tracking-tight text-text-primary">TechPulse</span>
          </Link>
          <button onClick={() => setMobileMenuOpen(false)} className="md:hidden text-text-secondary">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <div className="text-[11px] font-bold text-text-muted uppercase tracking-wider mb-2 px-3">Menu</div>
          <Link to="/dashboard" className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-bg-card transition-colors">
            Home
          </Link>
          
          <div className="text-[11px] font-bold text-text-muted uppercase tracking-wider mt-6 mb-2 px-3">Library</div>
          <Link to="/sources" className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-bg-card transition-colors">
            Sources
          </Link>
        </nav>

        <div className="p-3 border-t border-border-subtle">
          <Link to="/settings" className="flex items-center px-3 py-2 rounded-md text-sm font-medium bg-bg-card-elevated text-text-primary transition-colors">
            Settings
          </Link>
          <button onClick={handleLogout} className="w-full text-left flex items-center px-3 py-2 rounded-md text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-bg-card transition-colors">
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen">
        {/* Topbar */}
        <header className="h-14 border-b border-border-subtle bg-bg-primary/80 backdrop-blur-md sticky top-0 z-40 px-4 md:px-6 flex items-center justify-between gap-4">
          <button onClick={() => setMobileMenuOpen(true)} className="md:hidden text-text-secondary hover:text-text-primary">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
          </button>
          
          <div className="flex-1 max-w-md relative hidden sm:block">
            <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            <input 
              type="text" 
              placeholder="Search technology news..." 
              className="w-full bg-bg-card border border-border-subtle rounded-md py-1.5 pl-9 pr-3 text-sm text-text-primary focus:outline-none focus:border-accent-blue transition-colors"
            />
          </div>
          <div className="flex items-center gap-3 ml-auto">
            <button className="text-text-secondary hover:text-text-primary transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
            </button>
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-accent-cyan to-accent-blue cursor-pointer ring-2 ring-border-subtle"></div>
          </div>
        </header>

        <div className="flex-1 overflow-auto">
          <div className="max-w-3xl mx-auto p-4 md:p-6">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-text-primary mb-1">Settings</h1>
              <p className="text-text-secondary text-sm">Customize your news feed preferences.</p>
            </div>

            {isLoading ? (
              <div className="text-text-secondary text-sm">Loading your preferences...</div>
            ) : (
              <div className="bg-bg-card border border-border-subtle p-5 md:p-6 rounded-xl shadow-sm">
                
                {message && (
                  <div className={`p-3 mb-5 rounded-md text-sm font-medium ${message.includes('Error') || message.includes('Failed') ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-green-500/10 text-green-500 border border-green-500/20'}`}>{message}</div>
                )}

                <div className="mb-6">
                  <h3 className="text-base font-semibold text-text-primary mb-3">Topics of Interest</h3>
                  <div className="flex flex-wrap gap-2">
                    {availableCategories.length === 0 && <p className="text-text-muted text-sm">No categories available in the database.</p>}
                    {availableCategories.map(category => (
                      <button
                        key={category}
                        onClick={() => handleCategoryToggle(category)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${selectedCategories.includes(category) ? 'bg-accent-blue text-[#FAFAFA] border-accent-blue' : 'bg-bg-primary text-text-secondary border-border-subtle hover:text-text-primary hover:border-text-muted'}`}
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className="text-base font-semibold text-text-primary mb-3">Enabled Sources</h3>
                  <div className="flex flex-wrap gap-2">
                    {availableSources.length === 0 && <p className="text-text-muted text-sm">No sources available in the database.</p>}
                    {availableSources.map(source => (
                      <button
                        key={source.id}
                        onClick={() => handleSourceToggle(source.id)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${selectedSources.includes(source.id) ? 'bg-accent-purple text-[#FAFAFA] border-accent-purple' : 'bg-bg-primary text-text-secondary border-border-subtle hover:text-text-primary hover:border-text-muted'}`}
                      >
                        {source.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className="text-base font-semibold text-text-primary mb-3">Freshness</h3>
                  <label className="block text-text-secondary text-sm mb-2">Only show articles published in the:</label>
                  <div className="flex items-center gap-2">
                    <select
                      value={freshness}
                      onChange={(e) => setFreshness(e.target.value)}
                      className="bg-bg-primary border border-border-subtle rounded-md px-3 py-2 w-full sm:w-48 text-sm text-text-primary focus:outline-none focus:border-accent-blue transition-colors appearance-none"
                    >
                      <option value="1">Last 24 hours</option>
                      <option value="3">Last 3 days</option>
                      <option value="7">Last 7 days</option>
                      <option value="30">Last 30 days</option>
                    </select>
                  </div>
                </div>

                <div className="mb-8">
                  <h3 className="text-base font-semibold text-text-primary mb-3">Background Sync</h3>
                  
                  <div className="flex items-center justify-between mb-4 bg-bg-primary p-3 rounded-md border border-border-subtle">
                    <div>
                      <h4 className="text-sm font-medium text-text-primary">Auto Fetch News</h4>
                      <p className="text-xs text-text-secondary mt-0.5">Automatically fetch latest news in the background</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={autoFetch}
                        onChange={(e) => setAutoFetch(e.target.checked)}
                      />
                      <div className="w-9 h-5 bg-border-subtle peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-accent-blue"></div>
                    </label>
                  </div>

                  <div className={`transition-opacity ${autoFetch ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                    <label className="block text-text-secondary text-sm mb-2">Fetch Frequency:</label>
                    <select
                      value={fetchFrequency}
                      onChange={(e) => setFetchFrequency(e.target.value)}
                      disabled={!autoFetch}
                      className="bg-bg-primary border border-border-subtle rounded-md px-3 py-2 w-full sm:w-48 text-sm text-text-primary focus:outline-none focus:border-accent-blue transition-colors appearance-none"
                    >
                      <option value="15">Every 15 Minutes</option>
                      <option value="30">Every 30 Minutes</option>
                      <option value="60">Every 1 Hour</option>
                      <option value="360">Every 6 Hours</option>
                      <option value="720">Every 12 Hours</option>
                      <option value="1440">Every 24 Hours</option>
                    </select>
                  </div>
                </div>

                <button 
                  onClick={handleSave}
                  className="w-full sm:w-auto px-5 bg-gradient-to-r from-accent-blue to-accent-purple text-[#FAFAFA] text-sm font-medium py-2 rounded-md hover:opacity-90 transition-opacity shadow-sm"
                >
                  Save Preferences
                </button>
              </div>
            )}
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
