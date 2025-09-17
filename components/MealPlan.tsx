import React, { useState } from 'react';
import { MealPlanItem } from '../types';
import { Button } from './common/Button';
import { Icon } from './common/Icon';
import { ENERGY_LEVELS } from '../constants';

interface MealPlanProps {
    mealPlan: MealPlanItem[];
    onGeneratePlan: () => Promise<void>;
    onToggleTask: (mealDate: string, taskId: string) => void;
    onToggleFavorite: (recipeId: string) => void;
    isLoading: boolean;
}

const MealCard: React.FC<{ item: MealPlanItem; onToggleTask: (taskId: string) => void; onToggleFavorite: (recipeId: string) => void }> = ({ item, onToggleTask, onToggleFavorite }) => {
    const { recipe, prepTasks } = item;
    const [isExpanded, setIsExpanded] = useState(false);

    if (!recipe) {
        return (
            <div className="bg-background-secondary p-4 rounded-lg shadow-sm h-full flex flex-col justify-center items-center">
                <p className="text-text-secondary">Rest Day / Eat Out</p>
            </div>
        );
    }
    
    const energyConfig = ENERGY_LEVELS[recipe.energyLevel];

    return (
        <div className="bg-background-secondary p-4 rounded-lg shadow-sm h-full flex flex-col">
            <div className="flex-grow">
                <div className="flex justify-between items-start">
                    <h4 className="font-bold pr-2 font-heading">{recipe.name}</h4>
                    <button
                        onClick={() => onToggleFavorite(recipe.id)}
                        className="p-1 rounded-full hover:bg-functional-danger/10 text-neutral-medium/80 hover:text-functional-danger transition-colors flex-shrink-0"
                        aria-label={recipe.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                    >
                        <Icon name="heart" className={`w-5 h-5 ${recipe.isFavorite ? 'text-functional-danger fill-current' : ''}`} />
                    </button>
                </div>
                <p className="text-sm text-text-secondary mt-1">{recipe.description}</p>
                <div className="mt-2 flex items-center gap-4 text-xs">
                    <span title={`Energy: ${energyConfig.label}`} className={`px-2 py-1 rounded-full text-white ${energyConfig.color}`}>{energyConfig.label}</span>
                    <span className="text-text-secondary">Cleanup: {recipe.cleanupLevel}</span>
                </div>
            </div>
            <div className="mt-4">
                <button onClick={() => setIsExpanded(!isExpanded)} className="text-sm font-semibold text-primary hover:text-primary/80 flex items-center w-full justify-between">
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
                                className="h-4 w-4 rounded border-neutral-medium/50 text-primary focus:ring-primary"
                            />
                            <label htmlFor={`${item.date}-${task.id}`} className={`ml-3 text-text-secondary ${task.completed ? 'line-through text-neutral-medium' : ''}`}>
                                {task.task} ({task.durationMinutes} min)
                            </label>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

// Helper to get the Monday of a given date's week
const getMonday = (d: Date) => {
    d = new Date(d);
    d.setHours(0, 0, 0, 0);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    return new Date(d.setDate(diff));
};

const formatWeekRange = (start: Date) => {
    const end = new Date(start);
    end.setDate(end.getDate() + 6);

    const startMonth = start.toLocaleDateString('en-US', { month: 'short' });
    const endMonth = end.toLocaleDateString('en-US', { month: 'short' });
    const startDay = start.getDate();
    const endDay = end.getDate();
    const year = start.getFullYear();

    if (startMonth === endMonth) {
        return `Week of ${startMonth} ${startDay}-${endDay}, ${year}`;
    } else {
        return `Week of ${startMonth} ${startDay} - ${endMonth} ${endDay}, ${year}`;
    }
};

export const MealPlan: React.FC<MealPlanProps> = ({ mealPlan, onGeneratePlan, onToggleTask, onToggleFavorite, isLoading }) => {
    const [currentWeekStart, setCurrentWeekStart] = useState(getMonday(new Date()));
    
    const handlePreviousWeek = () => {
        const newDate = new Date(currentWeekStart);
        newDate.setDate(newDate.getDate() - 7);
        setCurrentWeekStart(newDate);
    };

    const handleNextWeek = () => {
        const newDate = new Date(currentWeekStart);
        newDate.setDate(newDate.getDate() + 7);
        setCurrentWeekStart(newDate);
    };
    
    const days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(currentWeekStart);
        d.setDate(d.getDate() + i);
        return d;
    });

    const getMealForDate = (date: Date) => {
        const dateString = date.toISOString().split('T')[0];
        return mealPlan.find(item => item.date === dateString) || null;
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <h1 className="text-3xl font-bold text-text-primary font-heading">Your Meal Plan</h1>
                <Button onClick={onGeneratePlan} isLoading={isLoading} className="mt-4 sm:mt-0 self-start sm:self-center">
                    {isLoading ? 'Generating...' : 'Generate New Week Plan'}
                </Button>
            </div>
            
            <div className="flex items-center justify-center gap-4 mb-6 p-2 bg-background-secondary rounded-lg">
                <Button variant="secondary" className="p-2" onClick={handlePreviousWeek} aria-label="Previous week">
                    <Icon name="chevron-left" className="w-5 h-5" />
                </Button>
                <p className="text-text-primary font-semibold w-52 text-center text-sm sm:text-base">{formatWeekRange(currentWeekStart)}</p>
                <Button variant="secondary" className="p-2" onClick={handleNextWeek} aria-label="Next week">
                    <Icon name="chevron-right" className="w-5 h-5" />
                </Button>
            </div>


            {mealPlan.length === 0 && !isLoading && (
                <div className="text-center py-20 bg-background-secondary rounded-lg shadow-sm">
                    <Icon name="calendar" className="mx-auto w-12 h-12 text-neutral-medium/60" />
                    <h3 className="mt-2 text-lg font-medium text-text-primary font-heading">Your meal plan is empty</h3>
                    <p className="mt-1 text-sm text-text-secondary">Generate a new plan to get started!</p>
                </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {days.map(day => {
                    const mealItem = getMealForDate(day);
                    return (
                        <div key={day.toISOString()} className="flex flex-col space-y-2">
                            <h3 className="font-semibold font-heading">{day.toLocaleDateString('en-US', { weekday: 'long' })}</h3>
                            {mealItem ? <MealCard item={mealItem} onToggleTask={(taskId) => onToggleTask(mealItem.date, taskId)} onToggleFavorite={onToggleFavorite} /> : (
                                <div className="bg-neutral-light/50 p-4 rounded-lg shadow-sm h-full flex flex-col justify-center items-center">
                                    <p className="text-neutral-medium text-sm">No meal planned</p>

                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};