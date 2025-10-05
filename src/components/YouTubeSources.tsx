import React from 'react';
import { YouTubeSource } from '../types';
import { Button } from './common/Button';
import { Icon } from './common/Icon';
import { v4 as uuidv4 } from 'uuid';

interface YouTubeSourcesProps {
    sources: YouTubeSource[];
    onSourcesChange: (sources: YouTubeSource[]) => void;
}

export const YouTubeSources: React.FC<YouTubeSourcesProps> = ({ sources, onSourcesChange }) => {
    const [url, setUrl] = React.useState('');
    const [name, setName] = React.useState('');

    const handleAddSource = () => {
        if (!url || !name) {
             alert('Please enter both a URL and a name.');
             return;
        };

        if (!url.startsWith('https://www.youtube.com/') && !url.startsWith('https://youtu.be/')) {
            alert('Please enter a valid YouTube URL.');
            return;
        }

        const newSource: YouTubeSource = { id: uuidv4(), url, name };
        onSourcesChange([...sources, newSource]);
        setUrl('');
        setName('');
    };

    const handleRemoveSource = (id: string) => {
        onSourcesChange(sources.filter(source => source.id !== id));
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="hidden md:block">
                <h1 className="text-3xl font-bold text-text-primary font-heading">YouTube Sources</h1>
                <p className="mt-1 text-text-secondary">Link videos for the AI to use as recipe inspiration.</p>
            </div>

            <div className="mt-8 max-w-2xl mx-auto md:mx-0 space-y-8">
                 <div className="p-6 bg-background-secondary rounded-lg shadow-sm">
                    <h3 className="text-lg font-medium text-text-primary font-heading">Add a New Video</h3>
                    
                    <div className="mt-4 space-y-4">
                        <div>
                            <label htmlFor="yt-name" className="sr-only">Video Name</label>
                            <input
                                type="text"
                                id="yt-name"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                placeholder="Video Name (e.g., '20-Min Garlic Noodles')"
                                className="block w-full rounded-md border-neutral-medium/30 shadow-sm focus:border-primary focus:ring-primary sm:text-sm bg-background-primary text-text-primary placeholder:text-text-secondary/70"
                            />
                        </div>
                        <div>
                             <label htmlFor="yt-url" className="sr-only">URL</label>
                            <input
                                type="url"
                                id="yt-url"
                                value={url}
                                onChange={e => setUrl(e.target.value)}
                                placeholder="Paste YouTube Video URL here..."
                                className="block w-full rounded-md border-neutral-medium/30 shadow-sm focus:border-primary focus:ring-primary sm:text-sm bg-background-primary text-text-primary placeholder:text-text-secondary/70"
                            />
                        </div>
                    </div>
                    <div className="mt-4 flex justify-end">
                         <Button onClick={handleAddSource} disabled={!url || !name}>
                            Add Video Source
                        </Button>
                    </div>
                 </div>

                <div className="mt-6 space-y-2">
                    <h3 className="text-xl font-semibold text-text-primary font-heading mb-4">Your Linked Videos</h3>
                    {sources.length > 0 ? (
                        sources.map(source => (
                            <div key={source.id} className="flex justify-between items-center p-3 bg-background-secondary rounded-md">
                                <div className="flex-grow overflow-hidden">
                                    <p className="text-sm font-medium text-text-primary truncate">{source.name}</p>
                                    <p className="text-xs text-text-secondary truncate">{source.url}</p>
                                </div>
                                <button onClick={() => handleRemoveSource(source.id)} className="p-1 text-functional-danger/70 hover:text-functional-danger flex-shrink-0 ml-4" aria-label={`Remove ${source.name}`}>
                                     <Icon name="trash" className="w-5 h-5" />
                                </button>
                            </div>
                        ))
                    ) : (
                         <div className="text-center py-10 bg-background-secondary rounded-lg">
                            <Icon name="upload" className="mx-auto w-10 h-10 text-neutral-medium/60" />
                            <p className="mt-2 text-sm text-text-secondary">You haven't added any YouTube sources yet.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};