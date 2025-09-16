import React, { useState, useMemo } from 'react';
import { Recipe } from '../types';
import { Icon } from './common/Icon';
import { ENERGY_LEVELS } from '../constants';

interface CookbookProps {
    cookbook: Recipe[];
    onToggleFavorite: (recipeId: string) => void;
}

const RecipeCard: React.FC<{ recipe: Recipe; onToggleFavorite: (recipeId: string) => void; }> = ({ recipe, onToggleFavorite }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const energyConfig = ENERGY_LEVELS[recipe.energyLevel];

    return (
        <div className="bg-background-secondary p-4 rounded-lg shadow-sm flex flex-col transition-all duration-300">
            <div className="flex justify-between items-start">
                <div className="flex-grow">
                    <h3 className="text-lg font-bold font-heading">{recipe.name}</h3>
                    <p className="text-sm text-text-secondary mt-1 capitalize">{recipe.cuisine}</p>
                </div>
                <button 
                    onClick={() => onToggleFavorite(recipe.id)} 
                    className="p-2 rounded-full hover:bg-functional-danger/10 text-neutral-medium/80 hover:text-functional-danger transition-colors"
                    aria-label="Remove from favorites"
                >
                    <Icon name="heart" className={`w-6 h-6 ${recipe.isFavorite ? 'text-functional-danger fill-current' : 'text-neutral-medium/80'}`} />
                </button>
            </div>
            <p className="text-sm text-text-secondary mt-2 flex-grow">{recipe.description}</p>
            <div className="mt-3 flex items-center gap-4 text-xs">
                <span title={`Energy: ${energyConfig.label}`} className={`px-2 py-1 rounded-full text-white ${energyConfig.color}`}>{energyConfig.label}</span>
                <span className="text-text-secondary">Cleanup: {recipe.cleanupLevel}</span>
                <span className="text-text-secondary">{recipe.totalTimeMinutes} min total</span>
            </div>
            <button onClick={() => setIsExpanded(!isExpanded)} className="text-sm font-semibold text-primary hover:text-primary/80 flex items-center w-full justify-between mt-4">
                <span>{isExpanded ? 'Hide Details' : 'Show Details'}</span>
                <Icon name="chevronDown" className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
            </button>
            {isExpanded && (
                <div className="mt-4 border-t border-neutral-medium/20 pt-4">
                    <h4 className="font-semibold text-sm mb-2 font-heading">Ingredients</h4>
                    <ul className="list-disc list-inside text-sm space-y-1 text-text-secondary">
                        {recipe.ingredients.map((ing, i) => <li key={i}>{ing.quantity} {ing.unit} {ing.name}</li>)}
                    </ul>
                    <h4 className="font-semibold text-sm mt-4 mb-2 font-heading">Prep Steps</h4>
                    <ol className="list-decimal list-inside text-sm space-y-1 text-text-secondary">
                        {recipe.prepSteps.map((step, i) => <li key={i}>{step.task} ({step.durationMinutes} min)</li>)}
                    </ol>
                </div>
            )}
        </div>
    );
};


export const Cookbook: React.FC<CookbookProps> = ({ cookbook, onToggleFavorite }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [cuisineFilter, setCuisineFilter] = useState('all');

    const uniqueCuisines = useMemo(() => {
        const cuisines = new Set(cookbook.map(r => r.cuisine.toLowerCase()));
        return ['all', ...Array.from(cuisines)];
    }, [cookbook]);

    const filteredRecipes = useMemo(() => {
        return cookbook.filter(recipe => {
            const lowerCaseSearch = searchTerm.toLowerCase();
            const matchesSearch = recipe.name.toLowerCase().includes(lowerCaseSearch) ||
                                  recipe.description.toLowerCase().includes(lowerCaseSearch) ||
                                  recipe.ingredients.some(ing => ing.name.toLowerCase().includes(lowerCaseSearch));
            const matchesCuisine = cuisineFilter === 'all' || recipe.cuisine.toLowerCase() === cuisineFilter;
            return matchesSearch && matchesCuisine;
        });
    }, [cookbook, searchTerm, cuisineFilter]);

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <h1 className="text-3xl font-bold text-text-primary font-heading">My Cookbook</h1>
            <p className="mt-1 text-text-secondary">Your collection of favorite recipes.</p>

            <div className="mt-6 mb-8 p-4 bg-background-secondary rounded-lg shadow-sm flex flex-col sm:flex-row gap-4">
                <div className="flex-grow">
                    <label htmlFor="search-cookbook" className="sr-only">Search</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg className="h-5 w-5 text-neutral-medium" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <input
                            type="text"
                            id="search-cookbook"
                            className="block w-full pl-10 pr-3 py-2 border border-neutral-medium/30 rounded-md leading-5 bg-background-primary text-text-primary placeholder:text-text-secondary/70 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm"
                            placeholder="Search recipes..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                <div>
                    <label htmlFor="cuisine-filter" className="sr-only">Filter by cuisine</label>
                    <select
                        id="cuisine-filter"
                        className="block w-full pl-3 pr-10 py-2 text-base border-neutral-medium/30 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md bg-background-primary text-text-primary"
                        value={cuisineFilter}
                        onChange={(e) => setCuisineFilter(e.target.value)}
                    >
                        {uniqueCuisines.map(cuisine => (
                            <option key={cuisine} value={cuisine} className="capitalize">{cuisine === 'all' ? 'All Cuisines' : cuisine}</option>
                        ))}
                    </select>
                </div>
            </div>

            {cookbook.length === 0 ? (
                <div className="text-center py-20 bg-background-secondary rounded-lg shadow-sm">
                    <Icon name="book-open" className="mx-auto w-12 h-12 text-neutral-medium/60" />
                    <h3 className="mt-2 text-lg font-medium text-text-primary font-heading">Your cookbook is empty</h3>
                    <p className="mt-1 text-sm text-text-secondary">Favorite a recipe from your meal plan to add it here!</p>
                </div>
            ) : filteredRecipes.length === 0 ? (
                 <div className="text-center py-20 bg-background-secondary rounded-lg shadow-sm">
                    <h3 className="mt-2 text-lg font-medium text-text-primary font-heading">No recipes found</h3>
                    <p className="mt-1 text-sm text-text-secondary">Try adjusting your search or filters.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredRecipes.sort((a,b) => a.name.localeCompare(b.name)).map(recipe => (
                        <RecipeCard key={recipe.id} recipe={recipe} onToggleFavorite={onToggleFavorite} />
                    ))}
                </div>
            )}
        </div>
    );
};