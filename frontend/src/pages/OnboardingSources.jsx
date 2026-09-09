import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/api';

const SOURCES = [
  { id: 'hn', name: 'Hacker News', category: 'Developer/News', desc: 'Computer science and entrepreneurship' },
  { id: 'tc', name: 'TechCrunch', category: 'Startup', desc: 'Reporting on the business of technology' },
  { id: 'verge', name: 'The Verge', category: 'Technology', desc: 'Technology, science, art, and culture' },
  { id: 'wired', name: 'WIRED', category: 'Technology', desc: 'How emerging technologies affect culture' },
  { id: 'ars', name: 'Ars Technica', category: 'Hardware', desc: 'Original IT news and reviews' },
  { id: 'tns', name: 'The New Stack', category: 'Developer', desc: 'Services and infrastructure' },
  { id: 'sm', name: 'Smashing Magazine', category: 'Web Dev', desc: 'For web designers and developers' },
  { id: 'mit', name: 'MIT Tech Review', category: 'AI/Tech', desc: 'Authority on the future of technology' }
];

function OnboardingSources() {
  const [selectedSources, setSelectedSources] = useState([]);
  const navigate = useNavigate();

  const toggleSource = (id) => {
    setSelectedSources(prev => 
      prev.includes(id) 
        ? prev.filter(sId => sId !== id)
        : [...prev, id]
    );
  };

  const handleFinish = async () => {
    try {
      // Fetch available sources from the backend
      const res = await api.get('/sources/');
      const dbSources = res.data.results || res.data;
      
      // Map selected static source IDs back to their names, then to DB IDs
      const selectedNames = selectedSources.map(id => SOURCES.find(s => s.id === id).name);
      const dbSelectedIds = dbSources
        .filter(s => selectedNames.includes(s.name))
        .map(s => s.id);
        
      await api.patch('/preferences/', { sources: dbSelectedIds });
    } catch (error) {
      console.error('Error saving sources:', error);
    }
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary flex flex-col items-center justify-center p-6 relative font-sans">
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-accent-purple/5 rounded-full blur-[150px] -z-10"></div>
      
      <div className="max-w-4xl w-full py-12">
        <div className="mb-12 text-center">
          <div className="text-sm text-accent-purple font-bold tracking-widest uppercase mb-4">Step 2 of 2</div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Choose the sources you trust.</h1>
          <p className="text-text-secondary text-lg">Select publications to curate your personalized news feed.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-16">
          {SOURCES.map(source => {
            const isSelected = selectedSources.includes(source.id);
            return (
              <div
                key={source.id}
                onClick={() => toggleSource(source.id)}
                className={`cursor-pointer p-5 rounded-2xl border transition-all duration-200 relative overflow-hidden group
                  ${isSelected 
                    ? 'border-accent-blue bg-accent-blue/5 shadow-[0_0_15px_rgba(79,124,255,0.15)]' 
                    : 'border-border-subtle bg-bg-card hover:border-border-subtle hover:bg-bg-card-elevated'
                  }`}
              >
                {isSelected && (
                  <div className="absolute top-4 right-4 text-accent-blue">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>
                  </div>
                )}
                
                <div className="w-10 h-10 rounded-lg bg-bg-primary border border-border-subtle flex items-center justify-center mb-4 text-text-muted font-bold text-lg group-hover:text-text-primary transition-colors">
                  {source.name.charAt(0)}
                </div>
                <h3 className="font-bold text-text-primary mb-1">{source.name}</h3>
                <div className="text-xs text-accent-blue mb-2 font-medium">{source.category}</div>
                <p className="text-sm text-text-secondary">{source.desc}</p>
              </div>
            );
          })}
        </div>

        <div className="flex justify-between items-center">
          <button 
            onClick={() => navigate('/onboarding/topics')}
            className="px-6 py-2 text-text-secondary hover:text-text-primary font-medium"
          >
            Back
          </button>
          <button 
            onClick={handleFinish}
            disabled={selectedSources.length === 0}
            className={`px-8 py-3 rounded-full font-bold transition-colors ${
              selectedSources.length > 0 
                ? 'bg-accent-blue text-[#FAFAFA] hover:bg-gray-200' 
                : 'bg-bg-card-elevated text-text-muted cursor-not-allowed'
            }`}
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

export default OnboardingSources;
