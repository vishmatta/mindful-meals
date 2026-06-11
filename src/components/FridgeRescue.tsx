

import React, { useState, useRef } from 'react';
import { DietaryPreferences } from '../types';
import { analyzeFridgeImage } from '../services/geminiService';
import { Button } from './common/Button';
import { Icon } from './common/Icon';
import { fileToGenerativePart } from '../utils/imageToGenerativePart';

interface FridgeRescueProps {
    preferences: DietaryPreferences;
}

export const FridgeRescue: React.FC<FridgeRescueProps> = ({ preferences }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<string | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsLoading(true);
        setError(null);
        setResult(null);
        setImagePreview(URL.createObjectURL(file));

        try {
            const { base64, mimeType } = await fileToGenerativePart(file);
            const analysisResult = await analyzeFridgeImage(base64, mimeType, preferences);
            setResult(analysisResult);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="max-w-3xl mx-auto">
                <div className="text-center">
                    <Icon name="rescue" className="mx-auto h-12 w-12 text-primary" />
                    <div className="hidden md:block">
                        <h1 className="mt-4 text-3xl font-bold text-text-primary font-heading">Fridge Rescue</h1>
                        <p className="mt-2 text-lg text-text-secondary">Feeling overwhelmed? Snap a pic of your ingredients, and we'll find a simple meal for you.</p>
                    </div>
                </div>

                <div className="mt-8">
                    <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                    <Button onClick={handleUploadClick} className="w-full justify-center py-3 text-base" isLoading={isLoading}>
                         <Icon name="upload" className="-ml-1 mr-2 h-5 w-5" />
                        {isLoading ? 'Analyzing...' : 'Upload a Photo'}
                    </Button>
                </div>
                
                {imagePreview && (
                    <div className="mt-8">
                        <h3 className="text-lg font-medium text-text-primary font-heading">Your Photo:</h3>
                        <img src={imagePreview} alt="Ingredients preview" className="mt-2 rounded-lg shadow-md w-full max-w-md mx-auto" />
                    </div>
                )}

                {error && <div className="mt-6 p-4 bg-functional-danger/20 text-functional-danger rounded-md">{error}</div>}
                
                {result && (
                    <div className="mt-8 p-6 bg-background-secondary rounded-lg shadow-sm">
                        <h2 className="text-xl font-semibold text-text-primary mb-4 font-heading">Here are some ideas:</h2>
                        <div className="text-text-secondary max-w-none">
                            {result.split('\n').map((line, i) => <p key={i}>{line}</p>)}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};