import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/api';

const TOPICS = [
  'AI', 'Startups', 'Cybersecurity', 'Cloud', 'Programming', 
  'Developer Tools', 'Gadgets', 'Apple', 'Google', 'Microsoft', 
  'Open Source', 'FinTech', 'Robotics', 'Web3'
];

function OnboardingTopics() {
  const [selectedTopics, setSelectedTopics] = useState([]);
  const navigate = useNavigate();

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

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary flex flex-col items-center justify-center p-6 relative font-sans">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-accent-blue/5 rounded-full blur-[150px] -z-10"></div>
      
      <div className="max-w-3xl w-full">
        <div className="mb-12 text-center">
          <div className="text-sm text-accent-blue font-bold tracking-widest uppercase mb-4">Step 1 of 2</div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">What are you interested in?</h1>
          <p className="text-text-secondary text-lg">Choose the topics you want to see in your personalized feed.</p>
        </div>

        <div className="flex flex-wrap justify-center gap-4 mb-16">
          {TOPICS.map(topic => {
            const isSelected = selectedTopics.includes(topic);
            return (
              <button
                key={topic}
                onClick={() => toggleTopic(topic)}
                className={`px-6 py-3 rounded-full text-lg font-medium transition-all duration-200 border
                  ${isSelected 
                    ? 'border-transparent bg-gradient-to-r from-accent-blue to-accent-purple text-[#FAFAFA] shadow-[0_0_15px_rgba(139,92,246,0.3)]' 
                    : 'border-border-subtle bg-bg-card text-text-secondary hover:border-accent-blue/50 hover:text-text-primary'
                  }`}
              >
                {topic}
              </button>
            );
          })}
        </div>

        <div className="flex justify-end">
          <button 
            onClick={handleContinue}
            disabled={selectedTopics.length === 0}
            className={`px-8 py-3 rounded-full font-bold transition-colors ${
              selectedTopics.length > 0 
                ? 'bg-accent-blue text-[#FAFAFA] hover:bg-gray-200' 
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
