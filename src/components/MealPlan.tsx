import React, { useState, useEffect } from 'react';
// Fix: Removed 'Cookbook' from import as it is not an exported type from '../types'.
import { DietaryPreferences, MealPlanItem, Recipe, MealPlanningPreferences, MealType } from '../types';
import { Button } from './common/Button';
import { Icon } from './common/Icon';
import { ENERGY_LEVELS } from '../constants';
import { Modal } from './common/Modal';
import { SelectionOptionGroup } from './common/SelectionOptionGroup';


interface MealPlanProps {
    mealPlan: MealPlanItem[];
    preferences: DietaryPreferences;
    cookbook: Recipe[];
    onGenerateWeek: (days: Date[]) => Promise<void>;
    onToggleTask: (mealDate: string, mealType: MealType, taskId: string) => void;
    onToggleFavorite: (recipeId: string, mealDate: string, mealType: MealType) => void;
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
    weeklyPreferences: string;
    setWeeklyPreferences: (prefs: string) => void;
    onUpdateBatchAssignments: (recipeId: string, mealType: MealType, newDates: string[], weekStart: Date) => void;
    currentWeekStart: Date;
    setCurrentWeekStart: (date: Date) => void;
    weekDaySelections: Record<string, number[]>;
    setWeekDaySelections: React.Dispatch<React.SetStateAction<Record<string, number[]>>>;
    onRemoveMeal: (recipeId: string, mealType: MealType, weekStart: Date) => void;
    onRegenerateAndReplace: (mealType: MealType, oldRecipeId: string, customInstructions: string, weekStart: Date) => Promise<void>;
    onReplaceWithCookbook: (mealType: MealType, oldRecipeId: string, newRecipe: Recipe, weekStart: Date) => void;
    onGenerateBatch: (mealType: MealType, days: Date[]) => Promise<void>;
    onResetWeek: (days: Date[]) => void;
}

const MealCard: React.FC<{
    item: MealPlanItem;
    onToggleFavorite: (recipeId: string, mealDate: string, mealType: MealType) => void;
    onClick: () => void;
    isBatch: boolean;
}> = ({ item, onToggleFavorite, onClick, isBatch }) => {
    if (!item.recipe) {
        return (
            <div className="bg-background-secondary p-4 rounded-lg shadow-sm h-full flex flex-col justify-center items-center">
                <p className="text-text-secondary">Rest Day / Eat Out</p>
            </div>
        );
    }
    const { recipe } = item;
    const energyConfig = ENERGY_LEVELS[recipe.energyLevel];

    return (
        <button onClick={onClick} className="bg-background-secondary p-4 rounded-lg shadow-sm h-full flex flex-col text-left w-full hover:shadow-md hover:border-primary border border-transparent transition-all">
            <div className="flex-grow">
                <div className="flex justify-between items-start">
                    <h4 className="font-bold text-sm pr-2 font-heading">{recipe.name}</h4>
                    <button
                        onClick={(e) => { e.stopPropagation(); onToggleFavorite(recipe.id, item.date, item.mealType); }}
                        className="p-1 rounded-full hover:bg-functional-danger/10 text-neutral-medium/80 hover:text-functional-danger transition-colors flex-shrink-0"
                        aria-label={recipe.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                    >
                        <Icon name="heart" className={`w-5 h-5 ${recipe.isFavorite ? 'text-functional-danger fill-current' : ''}`} />
                    </button>
                </div>
                <p className="text-xs text-text-secondary mt-1 line-clamp-2">{recipe.description}</p>
            </div>
            <div className="mt-2 flex items-center flex-wrap gap-x-3 gap-y-1 text-xs">
                {!isBatch && (
                    <span title={`Energy: ${energyConfig.label}`} className={`px-2 py-0.5 rounded-full text-white ${energyConfig.color}`}>{energyConfig.label}</span>
                )}
                <span className="text-text-secondary">{recipe.totalTimeMinutes} min</span>
            </div>
        </button>
    );
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

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

const BatchMealRow: React.FC<{
    mealType: MealType;
    days: Date[];
    mealPlan: MealPlanItem[];
    onToggleFavorite: (recipeId: string, mealDate: string, mealType: MealType) => void;
    onOpenDetailModal: (recipe: Recipe, mealType: MealType) => void;
    onAdd: () => void;
    loadingSlots: string[];
}> = ({ mealType, days, mealPlan, onToggleFavorite, onOpenDetailModal, onAdd, loadingSlots }) => {
    const relevantMeals = mealPlan.filter(item => 
        item.mealType === mealType && 
        days.some(d => d.toISOString().split('T')[0] === item.date)
    );

    const recipesWithDays = new Map<string, { recipe: Recipe, dates: string[] }>();
    relevantMeals.forEach(item => {
        if (item.recipe) {
            const entry = recipesWithDays.get(item.recipe.id) || { recipe: item.recipe, dates: [] };
            const dayOfWeek = new Date(item.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' });
            if (!entry.dates.includes(dayOfWeek)) {
                entry.dates.push(dayOfWeek);
            }
            recipesWithDays.set(item.recipe.id, entry);
        }
    });

    const uniqueRecipes = Array.from(recipesWithDays.values());
    const isAnythingLoading = loadingSlots.some(slot => slot.endsWith(mealType));
    
    return (
        <div className="bg-background-secondary p-4 rounded-lg">
            <h3 className="text-xl font-bold font-heading text-text-primary capitalize mb-4">{mealType}</h3>
            {isAnythingLoading ? (
                 <div className="flex items-center justify-center p-8 min-h-[140px]">
                    <Icon name="loading" className="w-10 h-10 text-primary animate-spin" />
                </div>
            ) : uniqueRecipes.length > 0 ? (
                <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-${uniqueRecipes.length || 1} gap-4`}>
                    {uniqueRecipes.map(({ recipe, dates }) => (
                        <button key={recipe.id} onClick={() => onOpenDetailModal(recipe, mealType)} className="bg-background-primary p-3 rounded-lg shadow-sm text-left hover:shadow-md hover:border-primary border border-transparent transition-all">
                            <div className="flex justify-between items-start">
                                <h4 className="font-bold text-sm pr-2 font-heading">{recipe.name}</h4>
                                <div
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onToggleFavorite(recipe.id, relevantMeals.find(i => i.recipe?.id === recipe.id)!.date, mealType);
                                    }}
                                    className="p-1 rounded-full hover:bg-functional-danger/10 text-neutral-medium/80 hover:text-functional-danger transition-colors flex-shrink-0"
                                    aria-label="Toggle favorite"
                                >
                                    <Icon name="heart" className={`w-5 h-5 ${recipe.isFavorite ? 'text-functional-danger fill-current' : ''}`} />
                                </div>
                            </div>
                            <p className="text-xs text-text-secondary mt-1 line-clamp-2 flex-grow">{recipe.description}</p>
                            <div className="mt-3 pt-3 border-t border-neutral-medium/20">
                                <p className="text-xs font-semibold text-text-secondary">Assigned Days:</p>
                                <p className="text-xs text-text-primary font-medium">{dates.join(', ')}</p>
                            </div>
                        </button>
                    ))}
                </div>
            ) : (
                <AddMealButton onClick={onAdd} />
            )}
        </div>
    );
};


const VarietyMealRow: React.FC<{
    mealType: MealType;
    days: Date[];
    renderMealSlot: (day: Date, mealType: MealType) => React.ReactNode;
}> = ({ mealType, days, renderMealSlot }) => {
    if (days.length === 0) {
        return (
            <div className="bg-background-secondary p-4 rounded-lg">
                <h3 className="text-xl font-bold font-heading text-text-primary capitalize mb-4">{mealType}</h3>
                <div className="text-center text-text-secondary italic py-4">
                    No meals planned for this category on the selected days.
                </div>
            </div>
        );
    }

    const gridColMap: { [key: number]: string } = {
        1: 'md:grid-cols-1',
        2: 'md:grid-cols-2',
        3: 'md:grid-cols-3',
        4: 'md:grid-cols-4',
        5: 'md:grid-cols-5',
        6: 'md:grid-cols-6',
        7: 'md:grid-cols-7',
    };
    const gridColsClass = gridColMap[days.length] || 'md:grid-cols-7';

    return (
        <div className="bg-background-secondary p-4 rounded-lg">
            <h3 className="text-xl font-bold font-heading text-text-primary capitalize mb-4">{mealType}</h3>
            {/* Desktop */}
            <div className={`hidden md:grid ${gridColsClass} gap-4`}>
                {days.map(day => (
                    <div key={day.toISOString()} className="flex flex-col items-center text-center">
                        <p className="text-sm font-semibold mb-2">{day.toLocaleDateString('en-US', { weekday: 'short' })}</p>
                        {renderMealSlot(day, mealType)}
                    </div>
                ))}
            </div>
            {/* Mobile */}
            <div className="md:hidden space-y-4">
                {days.map(day => (
                     <div key={day.toISOString()}>
                        <h4 className="font-semibold mb-2">{day.toLocaleDateString('en-US', { weekday: 'long' })}</h4>
                        {renderMealSlot(day, mealType)}
                    </div>
                ))}
            </div>
        </div>
    );
};


export const MealPlan: React.FC<MealPlanProps> = ({ 
    mealPlan, onGenerateWeek, onToggleTask, onToggleFavorite, isLoading, onGenerateToday, onFillMealType, onGenerateTargetedMeals,
    loadingSlots, failedSlots, onClearFailedSlot, weeklyPreferences, setWeeklyPreferences, preferences, onUpdateBatchAssignments,
    currentWeekStart, setCurrentWeekStart, weekDaySelections, setWeekDaySelections, cookbook, onRemoveMeal,
    onRegenerateAndReplace, onReplaceWithCookbook, onGenerateBatch, onResetWeek,
}) => {
    // Modal state
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [selectedDay, setSelectedDay] = useState<Date | null>(null);
    const [selectedMealType, setSelectedMealType] = useState<MealType | null>(null);
    
    const [detailModalRecipe, setDetailModalRecipe] = useState<Recipe | null>(null);
    const [detailModalMealType, setDetailModalMealType] = useState<MealType | null>(null);
    const [batchDayAssignments, setBatchDayAssignments] = useState<string[]>([]);
    
    const [replaceModalData, setReplaceModalData] = useState<{ recipe: Recipe; mealType: MealType } | null>(null);
    const [customInstructions, setCustomInstructions] = useState('');
    const [selectedCookbookId, setSelectedCookbookId] = useState<string>('');

    // Add modal selection state
    const [scope, setScope] = useState<'This Meal Only' | 'All Meal Types' | 'Rest of Today'>('This Meal Only');
    const [cookingMethod, setCookingMethod] = useState('Any Method');
    const [timeAvailable, setTimeAvailable] = useState('No Limit');

    const currentWeekKey = currentWeekStart.toISOString().split('T')[0];
    const selectedDays = weekDaySelections[currentWeekKey] ?? [0, 1, 2, 3, 4, 5, 6];

    useEffect(() => {
        if (detailModalRecipe && detailModalMealType) {
            const mealTypeKey = detailModalMealType.toLowerCase() as keyof MealPlanningPreferences;
            if (preferences.mealPlanning[mealTypeKey]?.mode === 'batch') {
                const assignedDates = mealPlan
                    .filter(item => item.mealType === detailModalMealType && item.recipe?.id === detailModalRecipe.id)
                    .map(item => item.date);
                setBatchDayAssignments(assignedDates);
            }
        }
    }, [detailModalRecipe, detailModalMealType, mealPlan, preferences.mealPlanning]);

    useEffect(() => {
      if (replaceModalData) {
        setCustomInstructions('');
        setSelectedCookbookId('');
      }
    }, [replaceModalData])
    
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
        setScope('This Meal Only');
        setCookingMethod('Any Method');
        setTimeAvailable('No Limit');
        setSelectedDay(day);
        setSelectedMealType(mealType);
        setIsAddModalOpen(true);
    };

    const days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(currentWeekStart);
        d.setDate(d.getDate() + i);
        return d;
    });

    const visibleDays = days.filter((_, index) => selectedDays.includes(index));

    const renderMealSlot = (day: Date, mealType: MealType) => {
        const dateString = day.toISOString().split('T')[0];
        const slotKey = `${dateString}-${mealType}`;
        const mealItem = getMealsForDate(day, mealPlan)[mealType];

        if (loadingSlots.includes(slotKey)) {
            return <LoadingSlot />;
        }

        if (failedSlots[slotKey]) {
            return <ErrorSlot onRetry={() => {
                onClearFailedSlot(slotKey);
                handleAddMealClick(day, mealType);
            }} />;
        }

        if (mealItem && mealItem.recipe) {
            return (
                <MealCard
                    item={mealItem}
                    onToggleFavorite={onToggleFavorite}
                    onClick={() => {
                        setDetailModalRecipe(mealItem.recipe!);
                        setDetailModalMealType(mealType);
                    }}
                    isBatch={false}
                />
            );
        }

        return <AddMealButton onClick={() => handleAddMealClick(day, mealType)} />;
    };
    
    const handleDayToggle = (dayIndex: number) => {
        const currentSelection = weekDaySelections[currentWeekKey] ?? [0, 1, 2, 3, 4, 5, 6];
        const newSelection = currentSelection.includes(dayIndex)
            ? currentSelection.filter(d => d !== dayIndex)
            : [...currentSelection, dayIndex].sort();
        setWeekDaySelections({ ...weekDaySelections, [currentWeekKey]: newSelection });
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-text-primary font-heading hidden md:block">Meal Plan</h1>
                    <p className="font-semibold text-lg">{formatWeekRange(currentWeekStart)}</p>
                </div>
                <div className="flex items-center gap-2 mt-4 md:mt-0">
                    <Button variant="secondary" onClick={handlePreviousWeek}><Icon name="chevron-left" className="w-5 h-5" /></Button>
                    <Button variant="secondary" onClick={handleNextWeek}><Icon name="chevron-right" className="w-5 h-5" /></Button>
                    <Button onClick={() => onGenerateWeek(days)} isLoading={isLoading} className="ml-4">
                        {isLoading ? 'Generating...' : 'Generate Full Week'}
                    </Button>
                    <Button onClick={() => onResetWeek(days)} variant="danger">Reset Week</Button>
                </div>
            </div>

            <div className="mb-8 p-4 bg-background-secondary rounded-lg">
                <label htmlFor="weekly-prefs" className="block text-sm font-medium text-text-secondary mb-2">
                    What are you in the mood for this week? (Optional)
                </label>
                <input
                    id="weekly-prefs"
                    type="text"
                    value={weeklyPreferences}
                    onChange={(e) => setWeeklyPreferences(e.target.value)}
                    placeholder="e.g., 'more vegetarian meals', 'use my saved garlic noodles video'"
                    className="block w-full rounded-md border-neutral-medium/30 shadow-sm focus:border-primary focus:ring-primary sm:text-sm bg-background-primary text-text-primary placeholder:text-text-secondary/70"
                />
            </div>
            
             <div className="mb-8 p-4 bg-background-secondary rounded-lg">
                <h3 className="text-md font-semibold text-text-primary mb-3">Show Days:</h3>
                <div className="flex flex-wrap gap-2">
                    {DAY_LABELS.map((label, index) => (
                         <button
                            key={index}
                            onClick={() => handleDayToggle(index)}
                            className={`px-3 py-1.5 text-sm font-medium rounded-lg border transition-colors w-12 ${
                                selectedDays.includes(index)
                                    ? 'bg-primary border-primary text-white'
                                    : 'bg-background-primary border-neutral-medium/30 text-text-primary hover:border-primary'
                            }`}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-6">
                {MEAL_TYPES_ORDER.map(mealType => {
                    const planningMode = preferences.mealPlanning[mealType.toLowerCase() as keyof MealPlanningPreferences]?.mode;
                    if (planningMode === 'batch') {
                        return (
                            <BatchMealRow
                                key={mealType}
                                mealType={mealType}
                                days={visibleDays}
                                mealPlan={mealPlan}
                                onToggleFavorite={onToggleFavorite}
                                onOpenDetailModal={(recipe, mt) => {
                                    setDetailModalRecipe(recipe);
                                    setDetailModalMealType(mt);
                                }}
                                onAdd={() => onGenerateBatch(mealType, days)}
                                loadingSlots={loadingSlots}
                            />
                        );
                    } else {
                        return (
                            <VarietyMealRow
                                key={mealType}
                                mealType={mealType}
                                days={visibleDays}
                                renderMealSlot={renderMealSlot}
                            />
                        );
                    }
                })}
            </div>
            
            <Modal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                title={`Generate ${selectedMealType}`}
            >
                {selectedDay && selectedMealType && (
                    <div className="space-y-6">
                        <SelectionOptionGroup title="Cooking Method" options={['Any Method', 'Air Fryer', 'Stovetop', 'Oven', 'Microwave']} selected={cookingMethod} onSelect={setCookingMethod} />
                        <SelectionOptionGroup title="Time Available" options={['No Limit', '15 minutes', '30 minutes', '1 hour']} selected={timeAvailable} onSelect={setTimeAvailable} />
                        <div className="flex justify-end pt-4">
                            <Button onClick={() => {
                                onGenerateTargetedMeals(selectedDay, selectedMealType, scope, cookingMethod, timeAvailable, currentWeekStart);
                                setIsAddModalOpen(false);
                            }}>
                                Generate Meal
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>
            
            {detailModalRecipe && detailModalMealType && (
                <Modal
                    isOpen={!!detailModalRecipe}
                    onClose={() => { setDetailModalRecipe(null); setDetailModalMealType(null); }}
                    title={detailModalRecipe.name}
                >
                    <div className="space-y-4">
                        <p className="text-text-secondary">{detailModalRecipe.description}</p>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
                            <span className={`px-2 py-1 rounded-full text-white ${ENERGY_LEVELS[detailModalRecipe.energyLevel].color}`}>{ENERGY_LEVELS[detailModalRecipe.energyLevel].label}</span>
                            <span className="text-text-secondary">Cleanup: {detailModalRecipe.cleanupLevel}</span>
                            <span className="text-text-secondary">{detailModalRecipe.totalTimeMinutes} min total</span>
                        </div>
                        <div>
                            <h4 className="font-semibold text-sm mb-2 font-heading">Ingredients</h4>
                            <ul className="list-disc list-inside text-sm space-y-1 text-text-secondary">
                                {detailModalRecipe.ingredients.map((ing, i) => <li key={i}>{ing.quantity} {ing.unit} {ing.name}</li>)}
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold text-sm mt-4 mb-2 font-heading">Instructions</h4>
                            <ol className="list-decimal list-inside text-sm space-y-2 text-text-secondary">
                                {detailModalRecipe.prepSteps.map((step, i) => <li key={i}>{step.task}</li>)}
                            </ol>
                        </div>
                         {preferences.mealPlanning[detailModalMealType.toLowerCase() as keyof MealPlanningPreferences]?.mode === 'batch' && (
                            <div>
                                <h4 className="font-semibold text-sm mt-4 mb-2 font-heading">Assigned Days</h4>
                                <div className="flex flex-wrap gap-2">
                                {days.map(day => {
                                    const dateString = day.toISOString().split('T')[0];
                                    const dayName = day.toLocaleDateString('en-US', { weekday: 'short' });
                                    const isAssigned = batchDayAssignments.includes(dateString);
                                    return (
                                        <button
                                            key={dateString}
                                            onClick={() => {
                                                const newAssignments = isAssigned
                                                    ? batchDayAssignments.filter(d => d !== dateString)
                                                    : [...batchDayAssignments, dateString];
                                                setBatchDayAssignments(newAssignments);
                                                onUpdateBatchAssignments(detailModalRecipe.id, detailModalMealType, newAssignments, currentWeekStart);
                                            }}
                                            className={`px-3 py-1.5 text-sm font-medium rounded-lg border ${isAssigned ? 'bg-primary border-primary text-white' : 'bg-background-secondary border-neutral-medium/30 text-text-primary'}`}
                                        >
                                            {dayName}
                                        </button>
                                    );
                                })}
                                </div>
                            </div>
                         )}
                        <div className="flex justify-end gap-2 pt-4 mt-4 border-t border-neutral-medium/20">
                            <Button variant="danger" onClick={() => {
                                onRemoveMeal(detailModalRecipe.id, detailModalMealType, currentWeekStart);
                                setDetailModalRecipe(null);
                            }}>
                                <Icon name="trash" className="w-4 h-4 mr-2" />
                                Remove
                            </Button>
                            <Button variant="secondary" onClick={() => {
                                setReplaceModalData({ recipe: detailModalRecipe, mealType: detailModalMealType });
                                setDetailModalRecipe(null);
                            }}>
                                <Icon name="refresh" className="w-4 h-4 mr-2" />
                                Replace
                            </Button>
                        </div>
                    </div>
                </Modal>
            )}
            
            {replaceModalData && (
                 <Modal isOpen={!!replaceModalData} onClose={() => setReplaceModalData(null)} title={`Replace ${replaceModalData.recipe.name}`}>
                    <div className="space-y-6">
                        <div>
                            <h4 className="text-md font-semibold text-text-secondary mb-2">Regenerate with AI</h4>
                             <textarea
                                rows={2}
                                value={customInstructions}
                                onChange={(e) => setCustomInstructions(e.target.value)}
                                placeholder="Add custom instructions (optional)..."
                                className="block w-full rounded-md border-neutral-medium/30 shadow-sm focus:border-primary focus:ring-primary sm:text-sm bg-background-primary text-text-primary placeholder:text-text-secondary/70"
                            />
                            <Button onClick={() => {
                                onRegenerateAndReplace(replaceModalData.mealType, replaceModalData.recipe.id, customInstructions, currentWeekStart);
                                setReplaceModalData(null);
                            }} className="mt-2">
                                Regenerate
                            </Button>
                        </div>
                        <div className="border-t border-neutral-medium/20 pt-6">
                            <h4 className="text-md font-semibold text-text-secondary mb-2">Replace from Cookbook</h4>
                            <div className="flex gap-2">
                                <select 
                                    value={selectedCookbookId}
                                    onChange={(e) => setSelectedCookbookId(e.target.value)}
                                    className="block w-full rounded-md border-neutral-medium/30 shadow-sm focus:border-primary focus:ring-primary sm:text-sm bg-background-primary text-text-primary"
                                >
                                    <option value="" disabled>Select a recipe...</option>
                                    {cookbook.filter(r => r.id !== replaceModalData.recipe.id).map(recipe => (
                                        <option key={recipe.id} value={recipe.id}>{recipe.name}</option>
                                    ))}
                                </select>
                                <Button onClick={() => {
                                    const newRecipe = cookbook.find(r => r.id === selectedCookbookId);
                                    if (newRecipe) {
                                        onReplaceWithCookbook(replaceModalData.mealType, replaceModalData.recipe.id, newRecipe, currentWeekStart);
                                    }
                                    setReplaceModalData(null);
                                }} disabled={!selectedCookbookId}>
                                    Replace
                                </Button>
                            </div>
                        </div>
                    </div>
                 </Modal>
            )}

        </div>
    );
};
