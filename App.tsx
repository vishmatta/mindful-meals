import React, { useState, useEffect, useCallback } from 'react';
import { View, DietaryPreferences, Ingredient, MealPlanItem, Recipe, PrepStep, ShoppingListItem, EnergyLevel, ScannedItem } from './types';
import { NAV_ITEMS, INITIAL_PANTRY, INITIAL_PREFERENCES, INITIAL_MEAL_PLAN } from './constants';
import { Dashboard } from './components/Dashboard';
import { MealPlan } from './components/MealPlan';
import { Pantry } from './components/Pantry';
import { ShoppingList } from './components/ShoppingList';
import { Preferences } from './components/Preferences';
import { FridgeRescue } from './components/FridgeRescue';
import { Cookbook } from './components/Cookbook';
import { Icon } from './components/common/Icon';
import { generateMealPlan, generateRecipes, generateTargetedRecipes, generateDayMeals } from './services/geminiService';

const NavLink: React.FC<{ item: { view: View; label: string; icon: string; }; active: boolean; onClick: () => void; }> = ({ item, active, onClick }) => (
    <button
        onClick={onClick}
        className={`flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-colors w-full text-left ${
            active ? 'bg-primary text-white' : 'text-text-secondary hover:bg-background-primary'
        }`}
    >
        <Icon name={item.icon} className="mr-3 h-6 w-6" />
        <span className="flex-1">{item.label}</span>
    </button>
);

const MobileNavLink: React.FC<{ item: { view: View; label: string; icon: string; }; active: boolean; onClick: () => void; }> = ({ item, active, onClick }) => (
    <button
        onClick={onClick}
        className={`flex flex-col items-center justify-center pt-2 pb-1 text-xs font-medium transition-colors ${
            active ? 'text-primary' : 'text-text-secondary'
        }`}
    >
        <Icon name={item.icon} className="h-6 w-6 mb-1" />
        <span className="truncate">{item.label}</span>
    </button>
);

const capitalize = (s: string) => {
    if (typeof s !== 'string' || s.length === 0) return '';
    return s.charAt(0).toUpperCase() + s.slice(1);
}

const createMealPlanItem = (recipe: Recipe, date: Date, mealType: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack'): MealPlanItem => {
    const dateString = date.toISOString().split('T')[0];
    return {
        date: dateString,
        mealType,
        recipe,
        prepTasks: recipe.prepSteps.map((step, i) => ({
            ...step,
            id: `${dateString}-${mealType}-step-${i}`,
            completed: false
        }))
    };
};

const MOBILE_NAV_VIEWS: View[] = [View.Dashboard, View.MealPlan, View.Pantry, View.ShoppingList, View.Cookbook];

export default function App() {
    const [currentView, setCurrentView] = useState<View>(View.Dashboard);
    const [preferences, setPreferences] = useState<DietaryPreferences>(INITIAL_PREFERENCES);
    const [pantryItems, setPantryItems] = useState<Ingredient[]>(INITIAL_PANTRY);
    const [mealPlan, setMealPlan] = useState<MealPlanItem[]>(INITIAL_MEAL_PLAN);
    const [shoppingList, setShoppingList] = useState<ShoppingListItem[]>([]);
    const [cookbook, setCookbook] = useState<Recipe[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [energyLevel, setEnergyLevel] = useState<EnergyLevel>(EnergyLevel.Cruising);
    const [theme, setTheme] = useState<'light' | 'dark'>('light');
    const [weeklyPreferences, setWeeklyPreferences] = useState<string>('');

    // State for granular UI feedback during generation
    const [loadingSlots, setLoadingSlots] = useState<string[]>([]);
    const [failedSlots, setFailedSlots] = useState<Record<string, string>>({});

    useEffect(() => {
        const savedTheme = localStorage.getItem('theme');
        const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
            setTheme(savedTheme);
        } else if (prefersDark) {
            setTheme('dark');
        }
    }, []);

    useEffect(() => {
        const root = window.document.documentElement;
        root.classList.remove('light', 'dark');
        root.classList.add(theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    const handleGenerateMealsForDays = async (daysToGenerate: Date[]) => {
        if (daysToGenerate.length === 0) return;

        const allSlots = daysToGenerate.flatMap(d => 
            ['Breakfast', 'Lunch', 'Snack', 'Dinner'].map(mt => `${d.toISOString().split('T')[0]}-${mt}`)
        );

        setIsLoading(true);
        setError(null);
        setLoadingSlots(current => [...new Set([...current, ...allSlots])]);
        setFailedSlots(current => {
            const next = { ...current };
            allSlots.forEach(s => delete next[s]);
            return next;
        });

        try {
            const promises = daysToGenerate.map(date => generateDayMeals(preferences, pantryItems, energyLevel, weeklyPreferences));
            const results = await Promise.allSettled(promises);

            const newItems: MealPlanItem[] = [];
            const newFailedSlots: Record<string, string> = {};

            results.forEach((result, index) => {
                const day = daysToGenerate[index];
                if (result.status === 'fulfilled') {
                    const dayMeals = result.value;
                    newItems.push(createMealPlanItem(dayMeals.breakfast, day, 'Breakfast'));
                    newItems.push(createMealPlanItem(dayMeals.lunch, day, 'Lunch'));
                    newItems.push(createMealPlanItem(dayMeals.snack, day, 'Snack'));
                    newItems.push(createMealPlanItem(dayMeals.dinner, day, 'Dinner'));
                } else {
                    const dateString = day.toISOString().split('T')[0];
                    const errorMessage = result.reason instanceof Error ? result.reason.message : 'Generation failed';
                    ['Breakfast', 'Lunch', 'Snack', 'Dinner'].forEach(mt => {
                        newFailedSlots[`${dateString}-${mt}`] = errorMessage;
                    });
                }
            });
            
            if (Object.keys(newFailedSlots).length > 0) {
                 setError("Some meals could not be generated. Please try again.");
            }

            setMealPlan(current => {
                const datesToGenerateSet = new Set(daysToGenerate.map(d => d.toISOString().split('T')[0]));
                const otherItems = current.filter(item => !datesToGenerateSet.has(item.date));
                return [...otherItems, ...newItems].sort((a, b) => a.date.localeCompare(b.date));
            });
            
            setFailedSlots(current => ({ ...current, ...newFailedSlots }));

        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred');
        } finally {
            setIsLoading(false);
            setLoadingSlots(current => current.filter(s => !allSlots.includes(s)));
        }
    };
    
    const handleClearFailedSlot = (slotKey: string) => {
        setFailedSlots(current => {
            const next = { ...current };
            delete next[slotKey];
            return next;
        });
    };

    const handleGenerateTargetedMeals = async (
        day: Date,
        mealType: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack',
        scope: 'This Meal Only' | 'All Meal Types' | 'Rest of Today',
        cookingMethod: string,
        timeAvailable: string,
        weekStart: Date,
    ) => {
        setIsLoading(true);
        setError(null);
        
        // Determine slots to update
        let targetSlots: { date: Date; mealType: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack' }[] = [];
        if (scope === 'This Meal Only') {
            targetSlots = [{ date: day, mealType }];
        } else if (scope === 'All Meal Types') {
            targetSlots = Array.from({ length: 7 }, (_, i) => {
                const d = new Date(weekStart);
                d.setDate(d.getDate() + i);
                return { date: d, mealType };
            });
        } else if (scope === 'Rest of Today') {
            const todayString = day.toISOString().split('T')[0];
            const mealsForToday = mealPlan.filter(item => item.date === todayString);
            const mealTypesForToday = new Set(mealsForToday.map(item => item.mealType));
            const allMealTypes: ('Breakfast' | 'Lunch' | 'Dinner' | 'Snack')[] = ['Breakfast', 'Lunch', 'Snack', 'Dinner'];
            const mealTypeIndex = allMealTypes.indexOf(mealType);
            const mealTypesToFill = allMealTypes.slice(mealTypeIndex).filter(mt => !mealTypesForToday.has(mt));
            targetSlots = mealTypesToFill.map(mt => ({ date: day, mealType: mt }));
        }
        
        const slotKeys = targetSlots.map(s => `${s.date.toISOString().split('T')[0]}-${s.mealType}`);
        setLoadingSlots(current => [...new Set([...current, ...slotKeys])]);
        setFailedSlots(current => {
            const next = { ...current };
            slotKeys.forEach(key => delete next[key]);
            return next;
        });

        try {
            const recipes = await generateTargetedRecipes(preferences, pantryItems, energyLevel, mealType, targetSlots.length, cookingMethod, timeAvailable, weeklyPreferences);
            
            if (recipes.length !== targetSlots.length) {
                throw new Error("Could not generate the requested number of meals.");
            }
            
            const newItems = recipes.map((recipe, index) => {
                const target = targetSlots[index];
                return createMealPlanItem(recipe, target.date, target.mealType);
            });

            setMealPlan(current => {
                const newItemsMap = new Map(newItems.map(i => [`${i.date}-${i.mealType}`, i]));
                const otherItems = current.filter(item => !newItemsMap.has(`${item.date}-${item.mealType}`));
                return [...otherItems, ...newItems].sort((a, b) => a.date.localeCompare(b.date));
            });

        } catch (err) {
            const message = err instanceof Error ? err.message : 'An unknown error occurred';
            setError(message);
            setFailedSlots(current => {
                const next = { ...current };
                slotKeys.forEach(key => next[key] = "Failed");
                return next;
            });
        } finally {
            setIsLoading(false);
            setLoadingSlots(current => current.filter(s => !slotKeys.includes(s)));
        }
    };

    const handleFillMealType = async (mealType: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack', weekStart: Date) => {
        await handleGenerateTargetedMeals(weekStart, mealType, 'All Meal Types', 'Any Method', 'No Limit', weekStart);
    };
    
    const handleGenerateToday = async () => {
        const today = new Date();
        const todayString = today.toISOString().split('T')[0];
        const slots = ['Breakfast', 'Lunch', 'Snack', 'Dinner'].map(mt => `${todayString}-${mt}`);
        
        setIsLoading(true);
        setError(null);
        setLoadingSlots(current => [...new Set([...current, ...slots])]);
        setFailedSlots(current => {
            const next = { ...current };
            slots.forEach(s => delete next[s]);
            return next;
        });

        try {
            const dayMeals = await generateDayMeals(preferences, pantryItems, energyLevel, weeklyPreferences);
    
            const newTodayItems: MealPlanItem[] = [
                createMealPlanItem(dayMeals.breakfast, today, 'Breakfast'),
                createMealPlanItem(dayMeals.lunch, today, 'Lunch'),
                createMealPlanItem(dayMeals.snack, today, 'Snack'),
                createMealPlanItem(dayMeals.dinner, today, 'Dinner'),
            ];
    
            const otherItems = mealPlan.filter(item => item.date !== todayString);
            
            setMealPlan([...otherItems, ...newTodayItems].sort((a, b) => a.date.localeCompare(b.date)));
    
        } catch (err) {
            const message = err instanceof Error ? err.message : 'An unknown error occurred';
            setError(message);
            setFailedSlots(current => {
                const next = { ...current };
                slots.forEach(s => { next[s] = "Failed"; });
                return next;
            });
        } finally {
            setIsLoading(false);
            setLoadingSlots(current => current.filter(s => !slots.includes(s)));
        }
    };
    
    const calculateShoppingList = useCallback(() => {
        const EXCLUDED_ITEMS = new Set(['water', 'salt', 'pepper', 'black pepper', 'oil', 'olive oil', 'vegetable oil']);
        
        const required = new Map<string, { quantity: number; unit: string; isOptional: boolean }>();
    
        mealPlan.forEach(item => {
            item.recipe?.ingredients.forEach(ing => {
                const cleanedName = ing.name.toLowerCase().replace(/\s*\(.*?\)\s*/g, '').trim();
    
                if (cleanedName.length === 0 || EXCLUDED_ITEMS.has(cleanedName)) return;
    
                const key = cleanedName;
                const current = required.get(key) || { quantity: 0, unit: ing.unit, isOptional: true };
                
                current.quantity += ing.quantity;
                current.isOptional = current.isOptional && (ing.isOptional ?? false);
                required.set(key, current);
            });
        });
    
        const inStockItems = new Set(
            pantryItems.filter(item => item.inStock).map(item => item.name.toLowerCase())
        );
    
        const newGeneratedItems: ShoppingListItem[] = [];
        required.forEach((value, name) => {
            if (value.quantity > 0 && !inStockItems.has(name)) {
                newGeneratedItems.push({
                    id: `gen-${name.replace(/\s+/g, '-')}`,
                    name: capitalize(name),
                    quantity: Math.ceil(value.quantity),
                    unit: value.unit,
                    store: 'HEB',
                    isGenerated: true,
                    isChecked: false,
                    isOptional: value.isOptional,
                });
            }
        });
    
        setShoppingList(currentList => {
            const userAddedItems = currentList.filter(item => !item.isGenerated);
            const userAddedItemNames = new Set(userAddedItems.map(i => i.name.toLowerCase()));
            const filteredNewGeneratedItems = newGeneratedItems.filter(i => !userAddedItemNames.has(i.name.toLowerCase()));
            return [...userAddedItems, ...filteredNewGeneratedItems];
        });
    }, [mealPlan, pantryItems]);


    useEffect(() => {
        calculateShoppingList();
    }, [calculateShoppingList]);

    const handleAddItemToPantry = (item: { name: string; category: string }) => {
        const newItem = { ...item, name: capitalize(item.name), id: new Date().getTime().toString(), inStock: true };
        setPantryItems(prev => [...prev, newItem].sort((a,b) => a.name.localeCompare(b.name)));
    };

    const handleDeleteItemFromPantry = (id: string) => {
        setPantryItems(prev => prev.filter(item => item.id !== id));
    };
    
    const handleUpdatePantryItem = (id: string, updates: { name: string; category: string }) => {
        setPantryItems(currentItems =>
            currentItems.map(item =>
                item.id === id ? { ...item, name: capitalize(updates.name), category: updates.category } : item
            ).sort((a, b) => a.name.localeCompare(b.name))
        );
    };

    const handleTogglePantryItem = (id: string) => {
        setPantryItems(currentItems =>
            currentItems.map(item =>
                item.id === id ? { ...item, inStock: !item.inStock } : item
            )
        );
    };

    const handleBatchUpdatePantry = (scannedItems: ScannedItem[]) => {
        setPantryItems(currentPantry => {
            const pantryMap = new Map(currentPantry.map(item => [item.name.toLowerCase(), item]));
            const newPantry = [...currentPantry];

            scannedItems.forEach(scannedItem => {
                const existingItem = pantryMap.get(scannedItem.name.toLowerCase());
                if (existingItem) {
                    // Item exists, just mark it as in stock
                    const index = newPantry.findIndex(p => p.id === existingItem.id);
                    if (index !== -1 && !newPantry[index].inStock) {
                        newPantry[index] = { ...newPantry[index], inStock: true };
                    }
                } else {
                    // New item, add it to the pantry
                    const newItem: Ingredient = {
                        id: `scan-${new Date().getTime()}-${scannedItem.name.replace(/\s+/g, '-')}`,
                        name: capitalize(scannedItem.name),
                        category: scannedItem.category,
                        inStock: true,
                    };
                    newPantry.push(newItem);
                }
            });

            return newPantry.sort((a, b) => a.name.localeCompare(b.name));
        });
    };
    
    const handleToggleTask = (mealDate: string, mealType: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack', taskId: string) => {
        setMealPlan(currentPlan =>
            currentPlan.map(item => {
                if (item.date === mealDate && item.mealType === mealType) {
                    return {
                        ...item,
                        prepTasks: item.prepTasks.map(task =>
                            task.id === taskId ? { ...task, completed: !task.completed } : task
                        ),
                    };
                }
                return item;
            })
        );
    };

    const handleToggleFavorite = (recipeId: string, mealDate?: MealPlanItem['date'], mealType?: MealPlanItem['mealType'], recipe?: Recipe) => {
        const isMealPlanToggle = !!(mealDate && mealType);
    
        if (isMealPlanToggle) {
            // Logic for a specific favorite toggle from the Meal Plan
            const planItem = mealPlan.find(i => i.date === mealDate && i.mealType === mealType);
            if (!planItem || !planItem.recipe) return;
    
            const isNowFavorite = !planItem.recipe.isFavorite;
    
            // Update only the specific meal plan item with a new recipe object to break reference
            const updatedPlan = mealPlan.map(item => 
                (item.date === mealDate && item.mealType === mealType) 
                ? { ...item, recipe: { ...item.recipe!, isFavorite: isNowFavorite } } 
                : item
            );
            setMealPlan(updatedPlan);
            
            // Now, update the cookbook based on this change
            if (isNowFavorite) {
                setCookbook(prev => {
                    if (!prev.some(r => r.id === recipeId)) {
                        return [...prev, { ...planItem.recipe!, isFavorite: true }];
                    }
                    return prev;
                });
            } else {
                // Check if any other instance in the *newly updated* plan is still a favorite
                const anyOtherIsFavorite = updatedPlan.some(i => i.recipe?.id === recipeId && i.recipe.isFavorite);
                if (!anyOtherIsFavorite) {
                    setCookbook(prev => prev.filter(r => r.id !== recipeId));
                }
            }
        } else {
            // Logic for a global favorite toggle from the Cookbook or a newly generated meal
            const isCurrentlyFavorite = cookbook.some(r => r.id === recipeId);
            const isNowFavorite = !isCurrentlyFavorite;
    
            // Update cookbook first
            if (isNowFavorite) {
                 const recipeToAdd = mealPlan.find(i => i.recipe?.id === recipeId)?.recipe 
                                || cookbook.find(r => r.id === recipeId) 
                                || recipe; // Use provided recipe if not found elsewhere
                if (recipeToAdd && !cookbook.some(r => r.id === recipeId)) {
                     setCookbook(prev => [...prev, { ...recipeToAdd, isFavorite: true }]);
                }
            } else {
                setCookbook(prev => prev.filter(r => r.id !== recipeId));
            }
    
            // Sync this global change to ALL meal plan items
            setMealPlan(prev => prev.map(item => {
                if (item.recipe?.id === recipeId) {
                    return { ...item, recipe: { ...item.recipe, isFavorite: isNowFavorite } };
                }
                return item;
            }));
        }
    };

    const handleAddItemToShoppingList = (item: Omit<ShoppingListItem, 'id' | 'isGenerated' | 'isChecked' | 'isOptional'>) => {
        const newItem: ShoppingListItem = {
            ...item,
            id: `user-${new Date().getTime()}`,
            isGenerated: false,
            isChecked: false,
            isOptional: false, // User-added items are not optional by default
        };
        setShoppingList(prev => [...prev, newItem]);
    };

    const handleDeleteItemFromShoppingList = (id: string) => {
        setShoppingList(prev => prev.filter(item => item.id !== id));
    };

    const handleUpdateShoppingListItem = (id: string, updates: Partial<Omit<ShoppingListItem, 'id'>>) => {
        setShoppingList(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
    }

    const handleClearCheckedShoppingListItems = () => {
        setShoppingList(prev => prev.filter(item => !item.isChecked));
    }

    const renderView = () => {
        switch (currentView) {
            case View.Dashboard:
                return <Dashboard 
                    setCurrentView={setCurrentView} 
                    mealPlan={mealPlan} 
                    energyLevel={energyLevel} 
                    setEnergyLevel={setEnergyLevel}
                    preferences={preferences}
                    pantryItems={pantryItems}
                    cookbook={cookbook}
                    onToggleFavorite={handleToggleFavorite}
                />;
            case View.MealPlan:
                return <MealPlan 
                    mealPlan={mealPlan} 
                    onGenerateMealsForDays={handleGenerateMealsForDays} 
                    onToggleTask={handleToggleTask} 
                    onToggleFavorite={handleToggleFavorite} 
                    isLoading={isLoading}
                    onGenerateToday={handleGenerateToday}
                    onFillMealType={handleFillMealType}
                    onGenerateTargetedMeals={handleGenerateTargetedMeals}
                    loadingSlots={loadingSlots}
                    failedSlots={failedSlots}
                    onClearFailedSlot={handleClearFailedSlot}
                    weeklyPreferences={weeklyPreferences}
                    setWeeklyPreferences={setWeeklyPreferences}
                />;
            case View.Cookbook:
                return <Cookbook cookbook={cookbook} onToggleFavorite={handleToggleFavorite} />;
            case View.Pantry:
                return <Pantry 
                    pantryItems={pantryItems} 
                    onAddItem={handleAddItemToPantry} 
                    onDeleteItem={handleDeleteItemFromPantry} 
                    onToggleStock={handleTogglePantryItem} 
                    onUpdateItem={handleUpdatePantryItem}
                    onBatchUpdate={handleBatchUpdatePantry}
                />;
            case View.ShoppingList:
                return <ShoppingList
                    items={shoppingList}
                    onAddItem={handleAddItemToShoppingList}
                    onUpdateItem={handleUpdateShoppingListItem}
                    onDeleteItem={handleDeleteItemFromShoppingList}
                    onClearChecked={handleClearCheckedShoppingListItems}
                    storeOptions={preferences.shoppingStores}
                />;
            case View.Preferences:
                return <Preferences preferences={preferences} onSave={setPreferences} theme={theme} onThemeChange={setTheme} />;
            case View.FridgeRescue:
                return <FridgeRescue preferences={preferences} />;
            default:
                return <Dashboard 
                    setCurrentView={setCurrentView} 
                    mealPlan={mealPlan} 
                    energyLevel={energyLevel} 
                    setEnergyLevel={setEnergyLevel}
                    preferences={preferences}
                    pantryItems={pantryItems}
                    cookbook={cookbook}
                    onToggleFavorite={handleToggleFavorite}
                />;
        }
    };

    const currentPage = NAV_ITEMS.find(item => item.view === currentView);

    return (
        <div className="h-screen bg-background-primary flex flex-col md:flex-row">
            {/* Desktop Sidebar */}
            <aside className="hidden md:flex flex-col w-64 bg-background-secondary p-4 border-r border-neutral-medium/20 flex-shrink-0">
                <div className="flex justify-center items-center mb-8">
                    <h1 className="text-4xl font-bold text-primary font-heading text-center">Mindful Meals</h1>
                </div>
                <nav className="space-y-2">
                    {NAV_ITEMS.map(item => (
                        <NavLink key={item.view} item={item} active={currentView === item.view} onClick={() => setCurrentView(item.view)} />
                    ))}
                </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
                 {/* Mobile Header */}
                 <header className="md:hidden sticky top-0 bg-background-primary/80 backdrop-blur-sm z-10 p-4 border-b border-neutral-medium/20">
                    <h1 className="text-2xl font-bold text-text-primary font-heading text-center">
                        {currentPage?.label}
                    </h1>
                </header>
                
                {error && (
                    <div className="m-4 p-4 bg-functional-danger/20 text-functional-danger rounded-lg flex justify-between items-center">
                        <span>Error: {error}</span>
                        <button onClick={() => setError(null)}><Icon name="x" className="w-5 h-5" /></button>
                    </div>
                )}
                {renderView()}
            </main>

            {/* Mobile Bottom Navigation */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-background-secondary border-t border-neutral-medium/20 grid grid-cols-5 z-20">
                {NAV_ITEMS.filter(item => MOBILE_NAV_VIEWS.includes(item.view)).map(item => (
                    <MobileNavLink key={item.view} item={item} active={currentView === item.view} onClick={() => setCurrentView(item.view)} />
                ))}
            </nav>
        </div>
    );
}