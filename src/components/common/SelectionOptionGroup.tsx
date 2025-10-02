

import React from 'react';

export const SelectionOptionGroup: React.FC<{ 
    title: string; 
    options: string[]; 
    selected: string; 
    onSelect: (option: string) => void; 
    className?: string;
}> = ({ title, options, selected, onSelect, className = '' }) => (
    <div className={className}>
        <h4 className="text-md font-semibold text-text-secondary mb-2">{title}</h4>
        <div className="flex flex-wrap gap-2">
            {options.map(option => (
                <button
                    key={option}
                    onClick={() => onSelect(option)}
                    className={`px-3 py-1.5 text-sm font-medium rounded-lg border transition-colors ${
                        selected === option
                            ? 'bg-primary border-primary text-white'
                            : 'bg-background-secondary border-neutral-medium/30 text-text-primary hover:border-primary'
                    }`}
                >
                    {option}
                </button>
            ))}
        </div>
    </div>
);