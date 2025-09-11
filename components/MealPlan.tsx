
import React, { useState } from 'react';
import { MealPlanItem, PrepStep } from '../types';
import { Button } from './common/Button';
import { Icon } from './common/Icon';
import { ENERGY_LEVELS } from '../constants';

interface MealPlanProps {
    mealPlan: MealPlanItem[];
    onGeneratePlan: () => Promise<void>;
    onToggleTask: (mealDate: string, taskId: string) => void;
    isLoading: boolean;
}

const MealCard: React.FC<{ item: MealPlanItem; onToggleTask: (taskId: string) => void }> = ({ item, onToggleTask }) => {
    const { recipe, prepTasks } = item;
    const [isExpanded, setIsExpanded] = useState(false);

    if (!recipe) {
        return (
            <div className="bg-white p-4 rounded-lg shadow-sm h-full flex flex-col justify-center items-center">
                <p className="text-gray-500">Rest Day / Eat Out</p>
            </div>
        );
    }
    
    const energyConfig = ENERGY_LEVELS[recipe.energyLevel];

    return (
        <div className="bg-white p-4 rounded-lg shadow-sm h-full flex flex-col">
            <div className="flex-grow">
                <h4 className="font-bold">{recipe.name}</h4>
                <p className="text-sm text-gray-500 mt-1">{recipe.description}</p>
                <div className="mt-2 flex items-center gap-4 text-xs">
                    <span title={`Energy: ${energyConfig.label}`} className={`px-2 py-1 rounded-full text-white ${energyConfig.color}`}>{energyConfig.label}</span>
                    <span className="text-gray-600">Cleanup: {recipe.cleanupLevel}</span>
                </div>
            </div>
            <div className="mt-4">
                <button onClick={() => setIsExpanded(!isExpanded)} className="text-sm font-semibold text-teal-600 hover:text-teal-800 flex items-center w-full justify-between">
                    <span>Prep Steps ({prepTasks.length})</span>
                    <Icon name="chevronDown" className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                </button>
            </div>
            {isExpanded && (
                <ul className="mt-3 space-y-2 text-sm">
                    {prepTasks.map(task => (
                        <li key={task.id} className="flex items-center">
                            <input
                                type="checkbox"
                                id={`${item.date}-${task.id}`}
                                checked={task.completed}
                                onChange={() => onToggleTask(task.id)}
                                className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                            />
                            <label htmlFor={`${item.date}-${task.id}`} className={`ml-3 text-gray-700 ${task.completed ? 'line-through text-gray-400' : ''}`}>
                                {task.task} ({task.durationMinutes} min)
                            </label>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export const MealPlan: React.FC<MealPlanProps> = ({ mealPlan, onGeneratePlan, onToggleTask, isLoading }) => {
    const days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() + i);
        return d;
    });

    const getMealForDate = (date: Date) => {
        const dateString = date.toISOString().split('T')[0];
        return mealPlan.find(item => item.date === dateString) || null;
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Your Meal Plan</h1>
                    <p className="mt-1 text-gray-600">A flexible plan for the week ahead.</p>
                </div>
                <Button onClick={onGeneratePlan} isLoading={isLoading} className="mt-4 sm:mt-0">
                    {isLoading ? 'Generating...' : 'Generate New Week Plan'}
                </Button>
            </div>

            {mealPlan.length === 0 && !isLoading && (
                <div className="text-center py-20 bg-white rounded-lg shadow-sm">
                    <Icon name="calendar" className="mx-auto w-12 h-12 text-gray-400" />
                    <h3 className="mt-2 text-lg font-medium text-gray-900">Your meal plan is empty</h3>
                    <p className="mt-1 text-sm text-gray-500">Generate a new plan to get started!</p>
                </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {days.map(day => {
                    const mealItem = getMealForDate(day);
                    return (
                        <div key={day.toISOString()} className="flex flex-col space-y-2">
                            <h3 className="font-semibold">{day.toLocaleDateString('en-US', { weekday: 'long' })}</h3>
                            {mealItem ? <MealCard item={mealItem} onToggleTask={(taskId) => onToggleTask(mealItem.date, taskId)} /> : (
                                <div className="bg-gray-100 p-4 rounded-lg shadow-sm h-full flex flex-col justify-center items-center">
                                    <p className="text-gray-400 text-sm">No meal planned</p>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
