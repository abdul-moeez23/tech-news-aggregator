import React, { useState, useRef, useEffect } from 'react';

export default function CustomSelect({ value, onChange, options, buttonClassName = "", dropdownClassName = "", disabled = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState('down');
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      // Assume max dropdown height is ~240px (e.g. max-h-60 = 15rem = 240px)
      if (spaceBelow < 240 && spaceAbove > spaceBelow) {
        setPosition('up');
      } else {
        setPosition('down');
      }
    }
  }, [isOpen]);

  const selectedOption = options.find(opt => String(opt.value) === String(value));

  return (
    <div className={`relative ${disabled ? 'opacity-50 pointer-events-none' : ''}`} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full flex items-center justify-between text-left focus:outline-none focus:border-accent-blue transition-colors cursor-pointer ${buttonClassName}`}
      >
        <span className="truncate">{selectedOption ? selectedOption.label : ''}</span>
        <svg className={`w-4 h-4 text-text-secondary flex-shrink-0 ml-2 transition-transform ${isOpen && position === 'down' ? 'rotate-180' : ''} ${isOpen && position === 'up' ? '' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
      </button>

      {isOpen && (
        <div className={`absolute z-10 w-full bg-bg-card border border-border-subtle rounded-md shadow-lg py-1 overflow-auto ${position === 'up' ? 'bottom-full mb-1' : 'top-full mt-1'} ${dropdownClassName}`}>
          {options.map((opt) => (
            <div
              key={opt.value}
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
              className={`px-3 py-2 cursor-pointer transition-colors ${
                String(opt.value) === String(value) 
                  ? 'bg-bg-card-elevated font-medium text-text-primary' 
                  : 'text-text-secondary hover:bg-accent-blue hover:text-[#FAFAFA]'
              }`}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
