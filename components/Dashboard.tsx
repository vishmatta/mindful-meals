import React, { useState } from 'react';
import { EnergyLevel, MealPlanItem, Recipe, View } from '../types';
import { ENERGY_LEVELS } from '../constants';
import { Icon } from './common/Icon';

interface DashboardProps {
    setCurrentView: (view: View) => void;
    mealPlan: MealPlanItem[];
}

const EnergyButton: React.FC<{ level: EnergyLevel; selected: boolean; onClick: () => void }> = ({ level, selected, onClick }) => {
    const config = ENERGY_LEVELS[level];
    return (
        <button
            onClick={onClick}
            className={`flex-1 p-4 rounded-lg text-center transition-all duration-200 ${selected ? `${config.color} text-white scale-105 shadow-lg` : 'bg-white hover:shadow-md'}`}
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

export const Dashboard: React.FC<DashboardProps> = ({ setCurrentView, mealPlan }) => {
    const [energyLevel, setEnergyLevel] = useState<EnergyLevel>(EnergyLevel.Cruising);
    
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

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Welcome!</h1>
                <p className="mt-1 text-gray-600">Let's figure out what's for dinner. No stress.</p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
                <h2 className="font-semibold text-lg mb-4">First, how's your energy right now?</h2>
                <div className="flex flex-col sm:flex-row gap-4">
                    {Object.values(EnergyLevel).map(level => (
                        <EnergyButton key={level} level={level} selected={energyLevel === level} onClick={() => setEnergyLevel(level)} />
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-teal-50 border-l-4 border-teal-500 p-6 rounded-r-lg">
                    <h2 className="font-bold text-xl text-teal-800 mb-3">What's Next?</h2>
                    {nextTask ? (
                        <>
                            <p className="text-gray-700 text-lg">Your next small step is:</p>
                            <p className="font-semibold text-2xl mt-2 text-teal-900">{nextTask.task}</p>
                            <p className="text-gray-600">for {nextTask.meal}.</p>
                        </>
                    ) : (
                        <p className="text-gray-700">You're all caught up! Consider generating a new meal plan.</p>
                    )}
                     <button onClick={() => setCurrentView(View.MealPlan)} className="mt-4 text-teal-600 font-semibold hover:underline">View Full Plan &rarr;</button>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm">
                    <h2 className="font-semibold text-lg mb-4">Based on your energy, try these:</h2>
                    {mealsToShow.length > 0 ? (
                         <ul className="space-y-3">
                            {mealsToShow.map(recipe => (
                                <li key={recipe.id} className="p-3 bg-gray-50 rounded-md flex justify-between items-center">
                                    <span>{recipe.name}</span>
                                    <span className="text-xs font-medium text-gray-500">{recipe.totalTimeMinutes} min</span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-gray-500 italic">No meals match this energy level in your current plan. Time for a crisis meal or Fridge Rescue!</p>
                    )}
                </div>
            </div>

        </div>
    );
};