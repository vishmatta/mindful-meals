import React, { useState } from 'react';
import { MealPlanItem } from '../types';
import { Button } from './common/Button';
import { Icon } from './common/Icon';
import { ENERGY_LEVELS } from '../constants';

type MealType = 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';

interface MealPlanProps {
    mealPlan: MealPlanItem[];
    onGeneratePlan: () => Promise<void>;
    onToggleTask: (mealDate: string, mealType: MealType, taskId: string) => void;
    onToggleFavorite: (recipeId: string) => void;
    isLoading: boolean;
    onGenerateToday: () => Promise<void>;
    onFillMealType: (mealType: MealType, weekStart: Date) => Promise<void>;
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
                    <h4 className="font-bold text-sm pr-2 font-heading">{recipe.name}</h4>
                    <button
                        onClick={() => onToggleFavorite(recipe.id)}
                        className="p-1 rounded-full hover:bg-functional-danger/10 text-neutral-medium/80 hover:text-functional-danger transition-colors flex-shrink-0"
                        aria-label={recipe.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                    >
                        <Icon name="heart" className={`w-5 h-5 ${recipe.isFavorite ? 'text-functional-danger fill-current' : ''}`} />
                    </button>
                </div>
                <p className="text-xs text-text-secondary mt-1 line-clamp-2">{recipe.description}</p>
                <div className="mt-2 flex items-center gap-2 text-xs">
                    <span title={`Energy: ${energyConfig.label}`} className={`px-2 py-0.5 rounded-full text-white ${energyConfig.color}`}>{energyConfig.label}</span>
                </div>
            </div>
            <div className="mt-3">
                <button onClick={() => setIsExpanded(!isExpanded)} className="text-xs font-semibold text-primary hover:text-primary/80 flex items-center w-full justify-between">
                    <span>Details</span>
                    <Icon name="chevronDown" className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                </button>
            </div>
            {isExpanded && (
                 <div className="mt-3 space-y-3 text-xs border-t border-neutral-medium/20 pt-3">
                    <p><b>Cleanup:</b> {recipe.cleanupLevel}</p>
                    <p><b>Total Time:</b> {recipe.totalTimeMinutes} min</p>
                    <div>
                        <h5 className="font-semibold mb-1">Prep Steps</h5>
                        <ul className="space-y-2">
                            {prepTasks.map(task => (
                                <li key={task.id} className="flex items-center">
                                    <input
                                        type="checkbox"
                                        id={`${item.date}-${item.mealType}-${task.id}`}
                                        checked={task.completed}
                                        onChange={() => onToggleTask(task.id)}
                                        className="h-4 w-4 rounded border-neutral-medium/50 text-primary focus:ring-primary"
                                    />
                                    <label htmlFor={`${item.date}-${item.mealType}-${task.id}`} className={`ml-2 text-text-secondary ${task.completed ? 'line-through text-neutral-medium' : ''}`}>
                                        {task.task} ({task.durationMinutes} min)
                                    </label>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
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

const MEAL_TYPES_ORDER: MealType[] = ['Breakfast', 'Lunch', 'Snack', 'Dinner'];

const getMealsForDate = (date: Date, mealPlan: MealPlanItem[]) => {
    const dateString = date.toISOString().split('T')[0];
    const meals = mealPlan.filter(item => item.date === dateString);
    const mealMap: { [key in MealType]?: MealPlanItem } = {};
    meals.forEach(meal => {
        mealMap[meal.mealType] = meal;
    });
    return mealMap;
};


export const MealPlan: React.FC<MealPlanProps> = ({ mealPlan, onGeneratePlan, onToggleTask, onToggleFavorite, isLoading, onGenerateToday, onFillMealType }) => {
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

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <h1 className="text-3xl font-bold text-text-primary font-heading">Your Meal Plan</h1>
                <Button onClick={onGeneratePlan} isLoading={isLoading} className="mt-4 sm:mt-0 self-start sm:self-center">
                    {isLoading ? 'Generating...' : 'Generate New Week (Dinners)'}
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

            <div className="p-4 bg-background-secondary rounded-lg mb-8">
                <h2 className="text-lg font-semibold text-text-primary mb-3 font-heading">Quick Actions</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 text-sm">
                    <Button variant="accent" onClick={onGenerateToday} disabled={isLoading}>Generate Today</Button>
                    <Button variant="accent" onClick={() => onFillMealType('Breakfast', currentWeekStart)} disabled={isLoading}>Fill Breakfasts</Button>
                    <Button variant="accent" onClick={() => onFillMealType('Lunch', currentWeekStart)} disabled={isLoading}>Fill Lunches</Button>
                    <Button variant="accent" onClick={() => onFillMealType('Snack', currentWeekStart)} disabled={isLoading}>Fill Snacks</Button>
                    <Button variant="accent" onClick={() => onFillMealType('Dinner', currentWeekStart)} disabled={isLoading}>Fill Dinners</Button>
                </div>
            </div>


            {mealPlan.length === 0 && !isLoading && (
                <div className="text-center py-20 bg-background-secondary rounded-lg shadow-sm">
                    <Icon name="calendar" className="mx-auto w-12 h-12 text-neutral-medium/60" />
                    <h3 className="mt-2 text-lg font-medium text-text-primary font-heading">Your meal plan is empty</h3>
                    <p className="mt-1 text-sm text-text-secondary">Use the buttons above to generate a new plan!</p>
                </div>
            )}
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
                {days.map(day => {
                    const mealsForDay = getMealsForDate(day, mealPlan);
                    return (
                        <div key={day.toISOString()} className="flex flex-col space-y-4 bg-background-secondary/40 p-3 rounded-lg">
                            <h3 className="font-semibold font-heading text-center">{day.toLocaleDateString('en-US', { weekday: 'long' })}</h3>
                            <div className="space-y-3">
                                {MEAL_TYPES_ORDER.map(mealType => {
                                    const mealItem = mealsForDay[mealType];
                                    return (
                                        <div key={mealType}>
                                            <h4 className="text-xs font-bold uppercase text-text-secondary mb-1">{mealType}</h4>
                                            {mealItem && mealItem.recipe ? (
                                                <MealCard 
                                                    item={mealItem} 
                                                    onToggleTask={(taskId) => onToggleTask(mealItem.date, mealItem.mealType, taskId)} 
                                                    onToggleFavorite={onToggleFavorite} 
                                                />
                                            ) : (
                                                <div className="bg-background-secondary/50 p-4 rounded-lg shadow-sm h-20 flex justify-center items-center border-2 border-dashed border-neutral-medium/20">
                                                    <p className="text-neutral-medium text-xs">Empty</p>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};