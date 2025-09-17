import React, { useState, useEffect, useCallback } from 'react';
import { View, DietaryPreferences, Ingredient, MealPlanItem, Recipe, PrepStep, ShoppingListItem, EnergyLevel } from './types';
import { NAV_ITEMS, INITIAL_PANTRY, INITIAL_PREFERENCES, INITIAL_MEAL_PLAN } from './constants';
import { Dashboard } from './components/Dashboard';
import { MealPlan } from './components/MealPlan';
import { Pantry } from './components/Pantry';
import { ShoppingList } from './components/ShoppingList';
import { Preferences } from './components/Preferences';
import { FridgeRescue } from './components/FridgeRescue';
import { Cookbook } from './components/Cookbook';
import { Icon } from './components/common/Icon';
import { generateMealPlan, generateRecipes, generateTargetedRecipes } from './services/geminiService';

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

    const handleGeneratePlan = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const recipes: Recipe[] = await generateMealPlan(preferences, pantryItems, energyLevel);
            const favoriteIds = new Set(cookbook.map(r => r.id));
            const recipesWithFavorites = recipes.map(r => ({ ...r, isFavorite: favoriteIds.has(r.id) }));

            const newPlan: MealPlanItem[] = recipesWithFavorites.map((recipe, index) => {
                const date = new Date();
                date.setDate(date.getDate() + index);
                return createMealPlanItem(recipe, date, 'Dinner');
            });
            setMealPlan(newPlan);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred');
        } finally {
            setIsLoading(false);
        }
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
        try {
            if (scope === 'This Meal Only') {
                const recipes = await generateTargetedRecipes(preferences, pantryItems, energyLevel, mealType, 1, cookingMethod, timeAvailable);
                if (recipes.length > 0) {
                    const newItem = createMealPlanItem(recipes[0], day, mealType);
                    setMealPlan(current => {
                        const others = current.filter(item => !(item.date === newItem.date && item.mealType === newItem.mealType));
                        return [...others, newItem].sort((a, b) => a.date.localeCompare(b.date));
                    });
                }
            } else if (scope === 'All Meal Types') {
                const recipes = await generateTargetedRecipes(preferences, pantryItems, energyLevel, mealType, 7, cookingMethod, timeAvailable);
                
                const newItemsMap = new Map<string, MealPlanItem>();
                recipes.forEach((recipe, index) => {
                    const date = new Date(weekStart);
                    date.setDate(date.getDate() + index);
                    const newItem = createMealPlanItem(recipe, date, mealType);
                    newItemsMap.set(newItem.date, newItem);
                });
        
                const weekEnd = new Date(weekStart);
                weekEnd.setDate(weekEnd.getDate() + 6);
                const weekStartString = weekStart.toISOString().split('T')[0];
                const weekEndString = weekEnd.toISOString().split('T')[0];
        
                const otherItems = mealPlan.filter(item => {
                    const isSameMealType = item.mealType === mealType;
                    const isInWeek = item.date >= weekStartString && item.date <= weekEndString;
                    return !(isSameMealType && isInWeek);
                });
        
                setMealPlan([...otherItems, ...Array.from(newItemsMap.values())].sort((a, b) => a.date.localeCompare(b.date)));
            } else if (scope === 'Rest of Today') {
                const todayString = day.toISOString().split('T')[0];
                const mealsForToday = mealPlan.filter(item => item.date === todayString);
                const mealTypesForToday = new Set(mealsForToday.map(item => item.mealType));

                const allMealTypes: ('Breakfast' | 'Lunch' | 'Dinner' | 'Snack')[] = ['Breakfast', 'Lunch', 'Snack', 'Dinner'];
                const mealTypeIndex = allMealTypes.indexOf(mealType);
                
                const mealTypesToFill = allMealTypes.slice(mealTypeIndex).filter(mt => !mealTypesForToday.has(mt));

                if (mealTypesToFill.length > 0) {
                    const promises = mealTypesToFill.map(mt => 
                        generateTargetedRecipes(preferences, pantryItems, energyLevel, mt, 1, cookingMethod, timeAvailable)
                    );
                    const results = await Promise.all(promises);

                    const newItems = results.flatMap((recipeArray, index) => {
                         if (!recipeArray || recipeArray.length === 0) return [];
                         return createMealPlanItem(recipeArray[0], day, mealTypesToFill[index]);
                    });

                    const otherItems = mealPlan.filter(item => {
                        const isToday = item.date === todayString;
                        const isMealToFill = mealTypesToFill.includes(item.mealType as any);
                        return !(isToday && isMealToFill);
                    });
                    
                    setMealPlan([...otherItems, ...newItems].sort((a,b)=> a.date.localeCompare(b.date)));
                }
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    const handleFillMealType = async (mealType: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack', weekStart: Date) => {
        // A `day` parameter is required, but it's not used for the 'All Meal Types' scope, so we can pass any valid date.
        await handleGenerateTargetedMeals(weekStart, mealType, 'All Meal Types', 'Any Method', 'No Limit', weekStart);
    };
    
    const handleGenerateToday = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const mealTypes: ('Breakfast' | 'Lunch' | 'Dinner' | 'Snack')[] = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];
            const promises = mealTypes.map(mt => generateRecipes(preferences, pantryItems, energyLevel, mt, 1));
            const results = await Promise.all(promises);
    
            const today = new Date();
            const todayString = today.toISOString().split('T')[0];
    
            const newTodayItems = results.map((recipeArray, index) => {
                if (!recipeArray || recipeArray.length === 0) return null;
                return createMealPlanItem(recipeArray[0], today, mealTypes[index]);
            }).filter((item): item is MealPlanItem => item !== null);
    
            const otherItems = mealPlan.filter(item => item.date !== todayString);
            
            setMealPlan([...otherItems, ...newTodayItems].sort((a, b) => a.date.localeCompare(b.date)));
    
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred');
        } finally {
            setIsLoading(false);
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

    const handleToggleFavorite = (recipeId: string) => {
        let sourceRecipe: Recipe | undefined;
        
        const mealPlanRecipe = mealPlan.find(item => item.recipe?.id === recipeId)?.recipe;
        sourceRecipe = mealPlanRecipe || cookbook.find(r => r.id === recipeId);

        if (!sourceRecipe) return;
        
        const isNowFavorite = !sourceRecipe.isFavorite;
        const updatedRecipe = { ...sourceRecipe, isFavorite: isNowFavorite };

        if (isNowFavorite) {
            setCookbook(prev => {
                if (prev.some(r => r.id === recipeId)) {
                    return prev.map(r => r.id === recipeId ? updatedRecipe : r);
                }
                return [...prev, updatedRecipe];
            });
        } else {
            setCookbook(prev => prev.filter(r => r.id !== recipeId));
        }

        setMealPlan(prevPlan => 
            prevPlan.map(item => {
                if (item.recipe?.id === recipeId) {
                    return { ...item, recipe: { ...item.recipe, isFavorite: isNowFavorite } };
                }
                return item;
            })
        );
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
                />;
            case View.MealPlan:
                return <MealPlan 
                    mealPlan={mealPlan} 
                    onGeneratePlan={handleGeneratePlan} 
                    onToggleTask={handleToggleTask} 
                    onToggleFavorite={handleToggleFavorite} 
                    isLoading={isLoading}
                    onGenerateToday={handleGenerateToday}
                    onFillMealType={handleFillMealType}
                    onGenerateTargetedMeals={handleGenerateTargetedMeals}
                />;
            case View.Cookbook:
                return <Cookbook cookbook={cookbook} onToggleFavorite={handleToggleFavorite} />;
            case View.Pantry:
                return <Pantry pantryItems={pantryItems} onAddItem={handleAddItemToPantry} onDeleteItem={handleDeleteItemFromPantry} onToggleStock={handleTogglePantryItem} onUpdateItem={handleUpdatePantryItem} />;
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
                />;
        }
    };

    return (
        <div className="flex h-screen bg-background-primary">
            <aside className="w-64 bg-background-secondary p-4 border-r border-neutral-medium/20 flex-shrink-0">
                <div className="flex justify-center items-center mb-8">
                    <h1 className="text-4xl font-bold text-primary font-heading">Mindful Meals</h1>
                </div>
                <nav className="space-y-2">
                    {NAV_ITEMS.map(item => (
                        <NavLink key={item.view} item={item} active={currentView === item.view} onClick={() => setCurrentView(item.view)} />
                    ))}
                </nav>
            </aside>
            <main className="flex-1 overflow-y-auto">
                {error && (
                    <div className="m-4 p-4 bg-functional-danger/20 text-functional-danger rounded-lg flex justify-between items-center">
                        <span>Error: {error}</span>
                        <button onClick={() => setError(null)}><Icon name="x" className="w-5 h-5" /></button>
                    </div>
                )}
                {renderView()}
            </main>
        </div>
    );
}
