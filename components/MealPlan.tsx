import React, { useState } from 'react';
import { MealPlanItem } from '../types';
import { Button } from './common/Button';
import { Icon } from './common/Icon';
import { ENERGY_LEVELS } from '../constants';
import { Modal } from './common/Modal';
import { SelectionOptionGroup } from './common/SelectionOptionGroup';

type MealType = 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';

interface MealPlanProps {
    mealPlan: MealPlanItem[];
    onGenerateWeek: (weekStart: Date) => Promise<void>;
    onToggleTask: (mealDate: string, mealType: MealType, taskId: string) => void;
    onToggleFavorite: (recipeId: string) => void;
    isLoading: boolean;
    onGenerateToday: () => Promise<void>;
    onFillMealType: (mealType: MealType, weekStart: Date) => Promise<void>;
    onGenerateTargetedMeals: (
        day: Date,
        mealType: MealType,
        scope: 'This Meal Only' | 'All Meal Types' | 'Rest of Today',
        cookingMethod: string,
        timeAvailable: string,
        weekStart: Date
    ) => Promise<void>;
    loadingSlots: string[];
    failedSlots: Record<string, string>;
    onClearFailedSlot: (slotKey: string) => void;
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
                 <div className="mt-2 flex items-center flex-wrap gap-x-3 gap-y-1 text-xs">
                    <span title={`Energy: ${energyConfig.label}`} className={`px-2 py-0.5 rounded-full text-white ${energyConfig.color}`}>{energyConfig.label}</span>
                    <span className="text-text-secondary">{recipe.totalTimeMinutes} min</span>
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
                    {recipe.cookingMethod && <p><b>Method:</b> {recipe.cookingMethod}</p>}
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
                    {recipe.substitutions && recipe.substitutions.length > 0 && (
                        <div>
                            <h5 className="font-semibold mt-2 mb-1">Substitutions</h5>
                            <ul className="list-disc list-inside space-y-1 text-text-secondary">
                                {recipe.substitutions.map((sub, i) => <li key={i}>{sub}</li>)}
                            </ul>
                        </div>
                    )}
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

const SlotContainer: React.FC<{ children: React.ReactNode, className?: string }> = ({ children, className }) => (
    <div className={`w-full h-full min-h-[140px] flex items-center justify-center bg-neutral-light/50 rounded-lg ${className}`}>
        {children}
    </div>
);

const LoadingSlot: React.FC = () => (
    <SlotContainer>
        <Icon name="loading" className="w-8 h-8 text-primary animate-spin" />
    </SlotContainer>
);

const ErrorSlot: React.FC<{ onRetry: () => void }> = ({ onRetry }) => (
    <SlotContainer className="flex-col p-2 text-center">
        <p className="text-xs text-functional-danger mb-2">Generation Failed</p>
        <Button variant="secondary" onClick={onRetry} className="py-1 px-2 text-xs">
            <Icon name="refresh" className="w-4 h-4 mr-1"/>
            Retry
        </Button>
    </SlotContainer>
);

const AddMealButton: React.FC<{ onClick?: () => void }> = ({ onClick }) => (
    <button 
        onClick={onClick}
        type="button"
        className="w-full h-full min-h-[140px] flex items-center justify-center bg-neutral-light/50 rounded-lg border-neutral-medium/20 text-neutral-medium hover:bg-neutral-light hover:border-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
        aria-label="Add meal"
    >
        <Icon name="plus" className="w-8 h-8" />
    </button>
);


export const MealPlan: React.FC<MealPlanProps> = ({ 
    mealPlan, onGenerateWeek, onToggleTask, onToggleFavorite, isLoading, onGenerateToday, onFillMealType, onGenerateTargetedMeals,
    loadingSlots, failedSlots, onClearFailedSlot
}) => {
    const [currentWeekStart, setCurrentWeekStart] = useState(getMonday(new Date()));

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedDay, setSelectedDay] = useState<Date | null>(null);
    const [selectedMealType, setSelectedMealType] = useState<MealType | null>(null);

    // Modal selection state
    const [scope, setScope] = useState<'This Meal Only' | 'All Meal Types' | 'Rest of Today'>('This Meal Only');
    const [cookingMethod, setCookingMethod] = useState('Any Method');
    const [timeAvailable, setTimeAvailable] = useState('No Limit');
    
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

    const handleAddMealClick = (day: Date, mealType: MealType) => {
        setSelectedDay(day);
        setSelectedMealType(mealType);
        // Reset selections to default
        setScope('This Meal Only');
        setCookingMethod('Any Method');
        setTimeAvailable('No Limit');
        setIsModalOpen(true);
    };

    const handleGenerate = async () => {
        if (selectedDay && selectedMealType) {
            await onGenerateTargetedMeals(selectedDay, selectedMealType, scope, cookingMethod, timeAvailable, currentWeekStart);
            setIsModalOpen(false);
        }
    };
    
    const days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(currentWeekStart);
        d.setDate(d.getDate() + i);
        return d;
    });

    const cookingMethodOptions = ['Any Method', 'Air Fryer', 'Stovetop', 'Oven', 'Microwave', 'Slow Cooker'];
    const timeAvailableOptions = ['No Limit', '15 minutes', '30 minutes', '1 hour'];
    
    const scopeOptionLabels = selectedMealType ? ['This Meal Only', `All ${selectedMealType}s This Week`, "Rest of Today's Meals"] : [];
    
    const handleScopeSelect = (label: string) => {
        if (label.includes('This Meal Only')) setScope('This Meal Only');
        else if (label.includes('All')) setScope('All Meal Types');
        else if (label.includes('Rest of Today')) setScope('Rest of Today');
    };

    const getSelectedScopeLabel = () => {
        switch (scope) {
            case 'This Meal Only': return 'This Meal Only';
            case 'All Meal Types': return `All ${selectedMealType}s This Week`;
            case 'Rest of Today': return "Rest of Today's Meals";
            default: return '';
        }
    };

    const renderMealSlot = (day: Date, mealType: MealType) => {
        const slotKey = `${day.toISOString().split('T')[0]}-${mealType}`;

        if (loadingSlots.includes(slotKey)) {
            return <LoadingSlot />;
        }

        if (failedSlots[slotKey]) {
            return <ErrorSlot onRetry={() => { onClearFailedSlot(slotKey); handleAddMealClick(day, mealType); }} />;
        }

        const mealsForDay = getMealsForDate(day, mealPlan);
        const mealItem = mealsForDay[mealType];

        if (mealItem && mealItem.recipe) {
            return <MealCard item={mealItem} onToggleTask={(taskId) => onToggleTask(mealItem.date, mealItem.mealType, taskId)} onToggleFavorite={onToggleFavorite} />;
        }

        return <AddMealButton onClick={() => handleAddMealClick(day, mealType)} />;
    };


    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <h1 className="text-3xl font-bold text-text-primary font-heading">Your Meal Plan</h1>
                <Button onClick={() => onGenerateWeek(currentWeekStart)} isLoading={isLoading} className="mt-4 sm:mt-0 self-start sm:self-center">
                    {isLoading ? 'Generating...' : 'Generate Week'}
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
            
            {/* Web Layout */}
            <div className="hidden md:block">
                <div className="grid grid-cols-[10rem_repeat(4,1fr)] gap-x-4 text-center font-semibold text-text-secondary mb-2 px-2">
                    <div className="text-left">Day</div>
                    <div>Breakfast</div>
                    <div>Lunch</div>
                    <div>Snack</div>
                    <div>Dinner</div>
                </div>
                <div className="space-y-2">
                    {days.map(day => (
                        <div key={day.toISOString()} className="grid grid-cols-[10rem_repeat(4,1fr)] gap-x-4 items-stretch rounded-lg bg-background-secondary/40 p-2 min-h-[160px]">
                            <div className="font-semibold font-heading flex items-center justify-start p-2">{day.toLocaleDateString('en-US', { weekday: 'long' })}</div>
                            {MEAL_TYPES_ORDER.map(mealType => (
                                <div key={mealType} className="py-1">
                                    {renderMealSlot(day, mealType)}
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            </div>

            {/* Mobile Layout */}
            <div className="md:hidden space-y-6">
                {days.map(day => (
                    <div key={day.toISOString()}>
                        <h3 className="font-semibold font-heading mb-3">{day.toLocaleDateString('en-US', { weekday: 'long' })}</h3>
                        <div className="flex overflow-x-auto space-x-4 pb-2 -mx-4 px-4">
                            {MEAL_TYPES_ORDER.map(mealType => (
                                <div key={mealType} className="w-64 flex-shrink-0">
                                    <h4 className="text-xs font-bold uppercase text-text-secondary mb-1">{mealType}</h4>
                                    {renderMealSlot(day, mealType)}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

             {selectedDay && selectedMealType && (
                <Modal 
                    isOpen={isModalOpen} 
                    onClose={() => setIsModalOpen(false)} 
                    title={`Generate ${selectedMealType} for ${selectedDay.toLocaleDateString('en-US', { weekday: 'long' })}`}
                >
                    <div className="space-y-6">
                        <SelectionOptionGroup 
                            title="1. Scope" 
                            options={scopeOptionLabels} 
                            selected={getSelectedScopeLabel()} 
                            onSelect={handleScopeSelect}
                        />
                        <SelectionOptionGroup 
                            title="2. Cooking Method" 
                            options={cookingMethodOptions} 
                            selected={cookingMethod} 
                            onSelect={setCookingMethod} 
                        />
                        <SelectionOptionGroup 
                            title="3. Time Available" 
                            options={timeAvailableOptions} 
                            selected={timeAvailable} 
                            onSelect={setTimeAvailable} 
                        />
                         <div className="flex justify-end pt-4 mt-2">
                            <Button variant="secondary" onClick={() => setIsModalOpen(false)} className="mr-2">Cancel</Button>
                            <Button onClick={handleGenerate} isLoading={isLoading}>
                                {isLoading ? "Generating..." : "Generate Meal"}
                            </Button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};