import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/api';

function OnboardingTopics() {
  const [selectedTopics, setSelectedTopics] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get('/categories/');
        setCategories(res.data.results || res.data);
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCategories();
  }, []);

  const toggleTopic = (topic) => {
    setSelectedTopics(prev => 
      prev.includes(topic) 
        ? prev.filter(t => t !== topic)
        : [...prev, topic]
    );
  };

  const handleContinue = async () => {
    try {
      await api.patch('/preferences/', { categories: selectedTopics });
    } catch (error) {
      console.error('Error saving topics:', error);
    }
    navigate('/onboarding/sources');
  };

  if (isLoading) {
    return <div className="min-h-screen bg-bg-primary flex items-center justify-center text-text-primary">Loading...</div>;
  }

  return (
    <div className="min-h-dvh bg-bg-primary text-text-primary flex flex-col items-center p-6 relative font-sans overflow-y-auto">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-accent-blue/5 rounded-full blur-[150px] -z-10"></div>
      
      <div className="max-w-4xl w-full py-12">
        <div className="mb-12 text-center">
          <div className="text-sm text-accent-blue font-bold tracking-widest uppercase mb-4">Step 1 of 2</div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">What are you interested in?</h1>
          <p className="text-text-secondary text-lg">Choose the topics and sub-topics you want to see in your personalized feed.</p>
        </div>

        <div className="space-y-8 mb-16">
          {categories.map(mainCat => (
            <div key={mainCat.id} className="bg-bg-card p-6 rounded-xl border border-border-subtle">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-text-primary">{mainCat.name}</h3>
                <button
                  onClick={() => toggleTopic(mainCat.name)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    selectedTopics.includes(mainCat.name)
                      ? 'bg-accent-blue text-white'
                      : 'bg-bg-primary border border-border-subtle text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {selectedTopics.includes(mainCat.name) ? 'Selected' : 'Select All'}
                </button>
              </div>
              
              {mainCat.subcategories && mainCat.subcategories.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {mainCat.subcategories.map(sub => {
                    const isSelected = selectedTopics.includes(sub.name);
                    return (
                      <button
                        key={sub.id}
                        onClick={() => toggleTopic(sub.name)}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 border
                          ${isSelected 
                            ? 'border-accent-purple bg-accent-purple/10 text-accent-purple' 
                            : 'border-border-subtle bg-bg-primary text-text-secondary hover:border-accent-blue/50 hover:text-text-primary'
                          }`}
                      >
                        {sub.name}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="flex justify-end sticky bottom-6">
          <button 
            onClick={handleContinue}
            disabled={selectedTopics.length === 0}
            className={`px-8 py-3 rounded-full font-bold transition-colors shadow-lg ${
              selectedTopics.length > 0 
                ? 'bg-accent-blue text-[#FAFAFA] hover:bg-blue-600' 
                : 'bg-bg-card-elevated text-text-muted cursor-not-allowed'
            }`}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}

export default OnboardingTopics;
