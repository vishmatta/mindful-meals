import React, { useState } from 'react';
import { EnergyLevel, MealPlanItem, Recipe, View, DietaryPreferences, Ingredient } from '../types';
import { ENERGY_LEVELS } from '../constants';
import { Icon } from './common/Icon';
import { Modal } from './common/Modal';
import { Button } from './common/Button';
import { generateSingleMeal } from '../services/geminiService';


interface DashboardProps {
    setCurrentView: (view: View) => void;
    mealPlan: MealPlanItem[];
    energyLevel: EnergyLevel;
    setEnergyLevel: (level: EnergyLevel) => void;
    preferences: DietaryPreferences;
    pantryItems: Ingredient[];
}

const EnergyButton: React.FC<{ level: EnergyLevel; selected: boolean; onClick: () => void }> = ({ level, selected, onClick }) => {
    const config = ENERGY_LEVELS[level];
    return (
        <button
            onClick={onClick}
            className={`flex-1 p-4 rounded-lg text-center transition-all duration-200 ${selected ? `${config.color} text-white scale-105 shadow-lg` : 'bg-background-secondary hover:shadow-md'}`}
        >
            <p className="font-bold text-lg">{config.label}</p>
            <p className="text-sm">{config.description}</p>
        </button>
    );
};

const getNextTask = (mealPlan: MealPlanItem[]) => {
    const today = new Date().toISOString().split('T')[0];
    for (const item of mealPlan) {
        if (item.date >= today) {
            for (const task of item.prepTasks) {
                if (!task.completed) {
                    return { task: task.task, meal: item.recipe?.name || 'a meal' };
                }
            }
        }
    }
    return null;
}

const SelectionOptionGroup: React.FC<{ title: string; options: string[]; selected: string; onSelect: (option: string) => void; }> = ({ title, options, selected, onSelect }) => (
    <div>
        <h4 className="text-md font-semibold text-text-secondary mb-2">{title}</h4>
        <div className="flex flex-wrap gap-2">
            {options.map(option => (
                <button
                    key={option}
                    onClick={() => onSelect(option)}
                    className={`px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${
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


export const Dashboard: React.FC<DashboardProps> = ({ setCurrentView, mealPlan, energyLevel, setEnergyLevel, preferences, pantryItems }) => {
    
    const [isSelectionModalOpen, setIsSelectionModalOpen] = useState(false);
    const [isResultModalOpen, setIsResultModalOpen] = useState(false);
    const [generatedRecipe, setGeneratedRecipe] = useState<Recipe | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generationError, setGenerationError] = useState<string | null>(null);

    const [mealType, setMealType] = useState('Any');
    const [cookingMethod, setCookingMethod] = useState('Any');
    const [timeAvailable, setTimeAvailable] = useState('No Limit');

    const nextTask = getNextTask(mealPlan);

    const recommendedMeals = mealPlan
        .filter(item => item.recipe && item.recipe.energyLevel === energyLevel)
        .slice(0, 3);
        
    const crisisMeals: Recipe[] = [
        { id: 'c1', name: 'Scrambled Eggs on Toast', description: '', ingredients: [], prepSteps:[], cookingTimeMinutes: 5, totalTimeMinutes: 7, energyLevel: EnergyLevel.SOS, cleanupLevel: 'low', isFavorite: false, cuisine: 'General' },
        { id: 'c2', name: 'Yogurt with Granola', description: '', ingredients: [], prepSteps:[], cookingTimeMinutes: 0, totalTimeMinutes: 2, energyLevel: EnergyLevel.SOS, cleanupLevel: 'low', isFavorite: false, cuisine: 'General' },
        { id: 'c3', name: 'Instant Noodles', description: '', ingredients: [], prepSteps:[], cookingTimeMinutes: 3, totalTimeMinutes: 5, energyLevel: EnergyLevel.SOS, cleanupLevel: 'low', isFavorite: false, cuisine: 'General' },
    ];
    
    const mealsToShow = energyLevel === EnergyLevel.SOS ? crisisMeals : recommendedMeals.map(m => m.recipe as Recipe);

    const handleGenerateSingleMeal = async () => {
        setIsGenerating(true);
        setGenerationError(null);
        try {
            const recipe = await generateSingleMeal(
                preferences,
                pantryItems,
                energyLevel,
                mealType,
                cookingMethod,
                timeAvailable
            );
            setGeneratedRecipe(recipe);
            setIsSelectionModalOpen(false);
            setIsResultModalOpen(true);
        } catch (err) {
            setGenerationError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setIsGenerating(false);
        }
    };

    const mealTypeOptions = ['Any', 'Breakfast', 'Lunch', 'Dinner', 'Snack'];
    const cookingMethodOptions = ['Any', 'Air Fryer', 'Stovetop', 'Oven', 'Microwave'];
    const timeAvailableOptions = ['No Limit', '15 min', '30 min', '1 hour'];

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-text-primary font-heading">Welcome!</h1>
                <p className="mt-1 text-text-secondary">Let's figure out what's for dinner. No stress.</p>
            </div>

            <div className="bg-background-secondary p-6 rounded-lg shadow-sm">
                <h2 className="font-semibold text-lg mb-4 font-heading">First, how's your energy right now?</h2>
                <div className="flex flex-col sm:flex-row gap-4">
                    {Object.values(EnergyLevel).map(level => (
                        <EnergyButton key={level} level={level} selected={energyLevel === level} onClick={() => setEnergyLevel(level)} />
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-primary/10 border-l-4 border-primary p-6 rounded-r-lg">
                    <h2 className="font-bold text-xl text-primary/90 mb-3 font-heading">What's Next?</h2>
                    {nextTask ? (
                        <>
                            <p className="text-text-secondary text-lg">Your next small step is:</p>
                            <p className="font-semibold text-2xl mt-2 text-primary">{nextTask.task}</p>
                            <p className="text-text-secondary">for {nextTask.meal}.</p>
                        </>
                    ) : (
                        <p className="text-text-secondary">You're all caught up! Consider generating a new meal plan.</p>
                    )}
                     <button onClick={() => setCurrentView(View.MealPlan)} className="mt-4 text-primary font-semibold hover:underline">View Full Plan &rarr;</button>
                </div>

                <div className="bg-background-secondary p-6 rounded-lg shadow-sm">
                    <h2 className="font-semibold text-lg mb-4 font-heading">Based on your energy, try these:</h2>
                    {mealsToShow.length > 0 ? (
                         <ul className="space-y-3">
                            {mealsToShow.map(recipe => (
                                <li key={recipe.id} className="p-3 bg-background-primary rounded-md flex justify-between items-center">
                                    <span>{recipe.name}</span>
                                    <span className="text-xs font-medium text-text-secondary">{recipe.totalTimeMinutes} min</span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-text-secondary italic">No meals match this energy level in your current plan. Time for a crisis meal or Fridge Rescue!</p>
                    )}
                </div>
            </div>

             <div className="mt-8 p-6 bg-background-secondary rounded-lg shadow-sm text-center">
                <h2 className="font-semibold text-lg mb-4 font-heading">Need a single idea right now?</h2>
                <p className="text-text-secondary mb-4 max-w-md mx-auto">Get a quick recipe based on your current energy, pantry, and a few simple choices.</p>
                <Button
                    onClick={() => setIsSelectionModalOpen(true)}
                    className="w-full max-w-xs mx-auto text-base py-3"
                >
                    Generate Single Meal
                </Button>
            </div>

            <Modal isOpen={isSelectionModalOpen} onClose={() => setIsSelectionModalOpen(false)} title="Generate a Single Meal">
                <div className="space-y-6">
                    <p className="text-text-secondary">Your current energy is set to <span className="font-semibold text-primary">{ENERGY_LEVELS[energyLevel].label}</span>. We'll find a recipe that fits.</p>
                    <SelectionOptionGroup title="Meal Type" options={mealTypeOptions} selected={mealType} onSelect={setMealType} />
                    <SelectionOptionGroup title="Cooking Method" options={cookingMethodOptions} selected={cookingMethod} onSelect={setCookingMethod} />
                    <SelectionOptionGroup title="Time Available" options={timeAvailableOptions} selected={timeAvailable} onSelect={setTimeAvailable} />
                    {generationError && <p className="text-functional-danger text-sm">{generationError}</p>}
                    <div className="flex justify-end pt-4">
                        <Button onClick={handleGenerateSingleMeal} isLoading={isGenerating}>
                            {isGenerating ? "Thinking..." : "Generate Meal"}
                        </Button>
                    </div>
                </div>
            </Modal>

            {generatedRecipe && (
                 <Modal isOpen={isResultModalOpen} onClose={() => setIsResultModalOpen(false)} title={generatedRecipe.name}>
                    <div className="space-y-4">
                        <p className="text-text-secondary">{generatedRecipe.description}</p>
                         <div className="flex flex-wrap items-center gap-4 text-xs">
                            <span title={`Energy: ${ENERGY_LEVELS[generatedRecipe.energyLevel].label}`} className={`px-2 py-1 rounded-full text-white ${ENERGY_LEVELS[generatedRecipe.energyLevel].color}`}>{ENERGY_LEVELS[generatedRecipe.energyLevel].label}</span>
                            <span className="text-text-secondary">Cleanup: {generatedRecipe.cleanupLevel}</span>
                            <span className="text-text-secondary">{generatedRecipe.totalTimeMinutes} min total</span>
                        </div>
                        <div>
                            <h4 className="font-semibold text-sm mb-2 font-heading">Ingredients</h4>
                            <ul className="list-disc list-inside text-sm space-y-1 text-text-secondary">
                                {generatedRecipe.ingredients.map((ing, i) => <li key={i}>{ing.quantity} {ing.unit} {ing.name}</li>)}
                            </ul>
                        </div>
                         <div>
                            <h4 className="font-semibold text-sm mt-4 mb-2 font-heading">Instructions</h4>
                            <ol className="list-decimal list-inside text-sm space-y-2 text-text-secondary">
                                {generatedRecipe.prepSteps.map((step, i) => <li key={i}>{step.task} ({step.durationMinutes} min)</li>)}
                            </ol>
                        </div>
                    </div>
                 </Modal>
            )}

        </div>
    );
};