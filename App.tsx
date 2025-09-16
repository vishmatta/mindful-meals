
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
import { generateMealPlan } from './services/geminiService';

const NavLink: React.FC<{ item: { view: View; label: string; icon: string; }; active: boolean; onClick: () => void; }> = ({ item, active, onClick }) => (
    <button
        onClick={onClick}
        className={`flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-colors w-full text-left ${
            active ? 'bg-teal-600 text-white' : 'text-gray-600 hover:bg-gray-100'
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
                return {
                    date: date.toISOString().split('T')[0],
                    mealType: 'Dinner',
                    recipe,
                    prepTasks: recipe.prepSteps.map((step, i) => ({
                        ...step,
                        id: `${date.toISOString().split('T')[0]}-step-${i}`,
                        completed: false
                    }))
                };
            });
            setMealPlan(newPlan);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred');
        } finally {
            setIsLoading(false);
        }
    };
    
    const calculateShoppingList = useCallback(() => {
        const required = new Map<string, { quantity: number; unit: string }>();

        mealPlan.forEach(item => {
            item.recipe?.ingredients.forEach(ing => {
                const key = ing.name.toLowerCase();
                if (key === 'water') return; // Do not add water to shopping list

                const current = required.get(key) || { quantity: 0, unit: ing.unit };
                current.quantity += ing.quantity;
                required.set(key, current);
            });
        });

        const inStockItems = new Set(
            pantryItems.filter(item => item.inStock).map(item => item.name.toLowerCase())
        );

        const newShoppingList: ShoppingListItem[] = [];
        required.forEach((value, name) => {
            if (value.quantity > 0 && !inStockItems.has(name)) {
                newShoppingList.push({ name: capitalize(name), quantity: Math.ceil(value.quantity), unit: value.unit });
            }
        });
        
        setShoppingList(newShoppingList);
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
    
    const handleToggleTask = (mealDate: string, taskId: string) => {
        setMealPlan(currentPlan =>
            currentPlan.map(item => {
                if (item.date === mealDate) {
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
        for (const item of mealPlan) {
            if (item.recipe?.id === recipeId) {
                sourceRecipe = item.recipe;
                break;
            }
        }
        if (!sourceRecipe) {
            sourceRecipe = cookbook.find(r => r.id === recipeId);
        }

        if (!sourceRecipe) return;
        
        const isNowFavorite = !sourceRecipe.isFavorite;
        const updatedRecipe = { ...sourceRecipe, isFavorite: isNowFavorite };

        if (isNowFavorite) {
            setCookbook(prev => {
                if (prev.find(r => r.id === recipeId)) {
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

    const renderView = () => {
        switch (currentView) {
            case View.Dashboard:
                return <Dashboard setCurrentView={setCurrentView} mealPlan={mealPlan} energyLevel={energyLevel} setEnergyLevel={setEnergyLevel} />;
            case View.MealPlan:
                return <MealPlan mealPlan={mealPlan} onGeneratePlan={handleGeneratePlan} onToggleTask={handleToggleTask} onToggleFavorite={handleToggleFavorite} isLoading={isLoading} />;
            case View.Cookbook:
                return <Cookbook cookbook={cookbook} onToggleFavorite={handleToggleFavorite} />;
            case View.Pantry:
                return <Pantry pantryItems={pantryItems} onAddItem={handleAddItemToPantry} onDeleteItem={handleDeleteItemFromPantry} onToggleStock={handleTogglePantryItem} onUpdateItem={handleUpdatePantryItem} />;
            case View.ShoppingList:
                return <ShoppingList items={shoppingList} onClear={() => {}} />;
            case View.Preferences:
                return <Preferences preferences={preferences} onSave={setPreferences} />;
            case View.FridgeRescue:
                return <FridgeRescue preferences={preferences} />;
            default:
                return <Dashboard setCurrentView={setCurrentView} mealPlan={mealPlan} energyLevel={energyLevel} setEnergyLevel={setEnergyLevel} />;
        }
    };

    return (
        <div className="flex h-screen bg-gray-100">
            <aside className="w-64 bg-white p-4 border-r border-gray-200 flex-shrink-0">
                <div className="flex items-center mb-8">
                    <h1 className="text-xl font-bold text-teal-600">Mindful Meals</h1>
                </div>
                <nav className="space-y-2">
                    {NAV_ITEMS.map(item => (
                        <NavLink key={item.view} item={item} active={currentView === item.view} onClick={() => setCurrentView(item.view)} />
                    ))}
                </nav>
            </aside>
            <main className="flex-1 overflow-y-auto">
                {error && (
                    <div className="m-4 p-4 bg-red-100 text-red-800 rounded-lg flex justify-between items-center">
                        <span>Error: {error}</span>
                        <button onClick={() => setError(null)}><Icon name="x" className="w-5 h-5" /></button>
                    </div>
                )}
                {renderView()}
            </main>
        </div>
    );
}
