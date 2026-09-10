import React, { useState, useEffect } from 'react';
import api from '../api/api';
import Layout from '../components/Layout';
import CustomSelect from '../components/CustomSelect';

const freshnessOptions = [
  { value: '1', label: 'Last 24 hours' },
  { value: '3', label: 'Last 3 days' },
  { value: '7', label: 'Last 7 days' },
  { value: '30', label: 'Last 30 days' },
];

const frequencyOptions = [
  { value: '15', label: '15 Mins' },
  { value: '30', label: '30 Mins' },
  { value: '60', label: '1 Hour' },
  { value: '360', label: '6 Hours' },
  { value: '720', label: '12 Hours' },
  { value: '1440', label: '24 Hours' },
];

export default function Settings() {
  const [availableCategories, setAvailableCategories] = useState([]);
  const [availableSources, setAvailableSources] = useState([]);
  
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [mutedTopics, setMutedTopics] = useState([]);
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
        
        const cats = catRes.data.results || catRes.data;
        const srcs = srcRes.data.results || srcRes.data;
        
        setAvailableCategories(cats);
        setAvailableSources(srcs);
        
        setSelectedCategories(prefRes.data.categories || []);
        setMutedTopics(prefRes.data.muted_topics || []);
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

  const handleCategoryToggle = (category) => {
    setSelectedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
    // If selecting, remove from muted
    if (!selectedCategories.includes(category)) {
      setMutedTopics(prev => prev.filter(c => c !== category));
    }
  };

  const handleMutedTopicToggle = (category) => {
    setMutedTopics(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
    // If muting, remove from selected
    if (!mutedTopics.includes(category)) {
      setSelectedCategories(prev => prev.filter(c => c !== category));
    }
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
        muted_topics: mutedTopics,
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
      setTimeout(() => setMessage(''), 3000);
    }
  };

  return (
    <Layout>
      <div className="w-full max-w-5xl mx-auto p-4 md:p-6">
        <div className="mb-4">
          <h1 className="text-xl font-bold text-text-primary mb-1">Settings</h1>
          <p className="text-text-secondary text-sm">Customize your news feed preferences.</p>
        </div>

        {isLoading ? (
          <div className="text-text-secondary text-sm">Loading your preferences...</div>
        ) : (
          <div className="bg-bg-card border border-border-subtle p-4 rounded-xl shadow-sm">
            
            {/* Toast Notification */}
            {message && (
              <div className="fixed top-20 right-4 z-50 flex items-center gap-3 px-4 py-3 bg-white border border-border-subtle rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] min-w-[280px] animate-toast-in">
                {message.includes('Error') || message.includes('Failed') ? (
                  <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                  </div>
                )}
                <div className="flex-1 text-sm font-semibold text-text-primary">
                  {message}
                </div>
                <button onClick={() => setMessage('')} className="ml-2 text-text-muted hover:text-text-primary transition-colors focus:outline-none">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            )}

            <div className="mb-5">
              <h3 className="text-sm font-semibold text-text-primary mb-2">Topics of Interest</h3>
              <div className="space-y-4">
                {availableCategories.length === 0 && <p className="text-text-muted text-xs">No categories available.</p>}
                {availableCategories.map(category => (
                  <div key={category.id} className="border border-border-subtle rounded-lg p-3 bg-bg-primary/50">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-2 gap-2 sm:gap-0">
                      <span className="text-sm font-medium text-text-primary">{category.name}</span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleCategoryToggle(category.name)}
                          className={`text-xs px-2 py-0.5 rounded border transition-colors ${
                            selectedCategories.includes(category.name)
                              ? 'bg-accent-blue/20 text-accent-blue border-accent-blue/30'
                              : 'bg-transparent text-text-secondary border-border-subtle hover:text-text-primary'
                          }`}
                        >
                          {selectedCategories.includes(category.name) ? 'Selected' : 'Select'}
                        </button>
                        <button
                          onClick={() => handleMutedTopicToggle(category.name)}
                          className={`text-xs px-2 py-0.5 rounded border transition-colors ${
                            mutedTopics.includes(category.name)
                              ? 'bg-red-500/20 text-red-500 border-red-500/30'
                              : 'bg-transparent text-text-secondary border-border-subtle hover:text-text-primary'
                          }`}
                        >
                          {mutedTopics.includes(category.name) ? 'Muted' : 'Mute'}
                        </button>
                      </div>
                    </div>
                    {category.subcategories && category.subcategories.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {category.subcategories.map(sub => (
                          <div key={sub.id} className="flex rounded border border-border-subtle overflow-hidden">
                            <button
                              onClick={() => handleCategoryToggle(sub.name)}
                              className={`px-2 py-1 text-[11px] font-medium transition-colors ${
                                selectedCategories.includes(sub.name) 
                                  ? 'bg-accent-purple/20 text-accent-purple' 
                                  : 'bg-bg-primary text-text-secondary hover:text-text-primary'
                              }`}
                            >
                              {sub.name}
                            </button>
                            <button
                              onClick={() => handleMutedTopicToggle(sub.name)}
                              className={`px-2 py-1 text-[11px] font-medium border-l border-border-subtle transition-colors ${
                                mutedTopics.includes(sub.name) 
                                  ? 'bg-red-500/20 text-red-500' 
                                  : 'bg-bg-primary text-text-secondary hover:text-red-400'
                              }`}
                              title={`Mute ${sub.name}`}
                            >
                              {mutedTopics.includes(sub.name) ? 'Muted' : '✕'}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="mb-5">
              <h3 className="text-sm font-semibold text-text-primary mb-2">Enabled Sources</h3>
              <div className="flex flex-wrap gap-1.5">
                {availableSources.length === 0 && <p className="text-text-muted text-xs">No sources available.</p>}
                {availableSources.map(source => (
                  <button
                    key={source.id}
                    onClick={() => handleSourceToggle(source.id)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                      selectedSources.includes(source.id) 
                        ? 'bg-accent-purple text-[#FAFAFA] border-accent-purple' 
                        : 'bg-bg-primary text-text-secondary border-border-subtle hover:text-text-primary hover:border-text-muted'
                    } ${!source.is_active ? 'opacity-70 border-dashed' : ''}`}
                    title={!source.is_active ? 'This source is disabled in Source Manager' : ''}
                  >
                    {source.name}
                    {!source.is_active && (
                      <span className="text-[9px] uppercase tracking-wider opacity-80">(Disabled)</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6 w-full">
              <div className="flex flex-col">
                <h3 className="text-sm font-semibold text-text-primary mb-2">Freshness</h3>
                <label className="block text-text-secondary text-xs mb-1.5">Only show articles published in the:</label>
                <CustomSelect
                  value={freshness}
                  onChange={setFreshness}
                  options={freshnessOptions}
                  buttonClassName="bg-bg-primary border border-border-subtle rounded-md pl-3 pr-2 w-full text-sm text-text-primary h-[42px]"
                  dropdownClassName="text-sm max-h-60"
                />
              </div>

              <div className="flex flex-col">
                <h3 className="text-sm font-semibold text-text-primary mb-2">Background Sync</h3>
                <label className="block text-transparent text-xs mb-1.5 select-none" aria-hidden="true">&nbsp;</label>
                <div className="flex items-center justify-between bg-bg-primary px-3 rounded-md border border-border-subtle mb-2 h-[42px]">
                  <div>
                    <h4 className="text-sm font-medium text-text-primary">Auto Fetch News</h4>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={autoFetch}
                      onChange={(e) => setAutoFetch(e.target.checked)}
                    />
                    <div className="w-8 h-4 bg-border-subtle peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-accent-blue"></div>
                  </label>
                </div>
                
                <div className={`transition-opacity flex items-center justify-between ${autoFetch ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                  <label className="text-text-secondary text-xs">Fetch Frequency:</label>
                  <CustomSelect
                    value={fetchFrequency}
                    onChange={setFetchFrequency}
                    options={frequencyOptions}
                    disabled={!autoFetch}
                    buttonClassName="bg-bg-primary border border-border-subtle rounded-md pl-2 pr-1 h-7 text-xs text-text-primary min-w-[90px]"
                    dropdownClassName="text-xs max-h-40"
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-border-subtle pt-4">
              <button 
                onClick={handleSave}
                className="w-full sm:w-auto px-4 py-1.5 bg-gradient-to-r from-accent-blue to-accent-purple text-[#FAFAFA] text-sm font-medium rounded-md hover:opacity-90 transition-opacity shadow-sm"
              >
                Save Preferences
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
