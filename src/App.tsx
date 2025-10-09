import React, { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import {
  DietaryPreferences,
  EnergyLevel,
  Ingredient,
  MealPlanItem,
  Recipe,
  ShoppingListItem,
  View,
  ScannedItem,
  MealPlanningPreferences,
  PrepStep,
} from './types';
import {
  INITIAL_PANTRY,
  INITIAL_PREFERENCES,
  INITIAL_MEAL_PLAN,
  NAV_ITEMS,
} from './constants';
import {
  generateDayMeals,
  generateRecipes,
  generateTargetedRecipes,
  generateSingleMeal,
  generateShoppingList,
} from './services/geminiService';

import { Dashboard } from './components/Dashboard';
import { MealPlan } from './components/MealPlan';
import { Pantry } from './components/Pantry';
import { ShoppingList } from './components/ShoppingList';
import { Preferences } from './components/Preferences';
import { FridgeRescue } from './components/FridgeRescue';
import { Cookbook } from './components/Cookbook';
import { Icon } from './components/common/Icon';

type MealType = 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';

const getStartOfWeek = () => {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
  return new Date(new Date(now.setDate(diff)).setHours(0, 0, 0, 0));
};

const getStartOfWeekForDate = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    return new Date(new Date(d.setDate(diff)).setHours(0, 0, 0, 0));
};

function App() {
  const [currentView, setCurrentView] = useState<View>(View.Dashboard);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light' || savedTheme === 'dark') {
      return savedTheme;
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  // Load state from local storage or use initials
  const [preferences, setPreferences] = useState<DietaryPreferences>(() => JSON.parse(localStorage.getItem('preferences') || JSON.stringify(INITIAL_PREFERENCES)));
  const [pantryItems, setPantryItems] = useState<Ingredient[]>(() => JSON.parse(localStorage.getItem('pantry') || JSON.stringify(INITIAL_PANTRY)));
  const [mealPlan, setMealPlan] = useState<MealPlanItem[]>(() => JSON.parse(localStorage.getItem('mealPlan') || JSON.stringify(INITIAL_MEAL_PLAN)));
  const [cookbook, setCookbook] = useState<Recipe[]>(() => JSON.parse(localStorage.getItem('cookbook') || '[]'));
  
  const [energyLevel, setEnergyLevel] = useState<EnergyLevel>(EnergyLevel.Cruising);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState<string[]>([]);
  const [failedSlots, setFailedSlots] = useState<Record<string, string>>({});
  const [weeklyPreferencesByWeek, setWeeklyPreferencesByWeek] = useState<Record<string, string>>(() => JSON.parse(localStorage.getItem('weeklyPreferencesByWeek') || '{}'));
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(getStartOfWeek());
  const [weekDaySelections, setWeekDaySelections] = useState<Record<string, number[]>>({});
  const [shoppingList, setShoppingList] = useState<ShoppingListItem[]>(() => JSON.parse(localStorage.getItem('shoppingList') || '[]'));
  const [isShoppingListLoading, setIsShoppingListLoading] = useState(false);
  const [debounceTimeout, setDebounceTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);

  // Persist state to local storage
  useEffect(() => { localStorage.setItem('preferences', JSON.stringify(preferences)); }, [preferences]);
  useEffect(() => { localStorage.setItem('pantry', JSON.stringify(pantryItems)); }, [pantryItems]);
  useEffect(() => { localStorage.setItem('mealPlan', JSON.stringify(mealPlan)); }, [mealPlan]);
  useEffect(() => { localStorage.setItem('cookbook', JSON.stringify(cookbook)); }, [cookbook]);
  useEffect(() => { localStorage.setItem('shoppingList', JSON.stringify(shoppingList)); }, [shoppingList]);
  useEffect(() => { localStorage.setItem('weeklyPreferencesByWeek', JSON.stringify(weeklyPreferencesByWeek)); }, [weeklyPreferencesByWeek]);
  
  // Theme management
  useEffect(() => {
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(theme);
    if (localStorage.getItem('theme') !== theme) {
      localStorage.setItem('theme', theme);
    }
  }, [theme]);

  // Listen for changes in OS/browser theme preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      // Only update if the user hasn't made a manual selection in the app
      if (!localStorage.getItem('theme')) {
        setTheme(e.matches ? 'dark' : 'light');
      }
    };

    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  // Generate shopping list from meal plan and pantry stock
  useEffect(() => {
    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }

    const timeoutId = setTimeout(() => {
      const generateList = async () => {
        setIsShoppingListLoading(true);
        try {
          const weekDates = new Set(Array.from({length: 7}, (_, i) => {
            const d = new Date(currentWeekStart);
            d.setDate(d.getDate() + i);
            return d.toISOString().split('T')[0];
          }));
          
          const recipesForWeek = mealPlan
            .filter(item => weekDates.has(item.date) && item.recipe)
            .map(item => item.recipe!);
            
          if (recipesForWeek.length === 0) {
              setShoppingList(sl => sl.filter(i => !i.isGenerated)); // Clear generated items if no recipes
              setIsShoppingListLoading(false);
              return;
          }

          const inStockPantry = pantryItems.filter(i => i.inStock);

          const generatedItems = await generateShoppingList(
            recipesForWeek,
            inStockPantry,
            preferences.shoppingStores
          );

          setShoppingList(prevList => {
            const manualItems = prevList.filter(i => !i.isGenerated);
            const newGeneratedItems = generatedItems.map(newItem => {
              const oldItem = prevList.find(old => old.isGenerated && old.name.toLowerCase() === newItem.name.toLowerCase());
              return { 
                  ...newItem, 
                  id: oldItem ? oldItem.id : uuidv4(),
                  isGenerated: true,
                  isChecked: oldItem ? oldItem.isChecked : false,
              };
            });
            return [...manualItems, ...newGeneratedItems];
          });
          
        } catch (error) {
          console.error("Failed to generate shopping list:", error);
          // Maybe set an error state to show in the UI
        } finally {
          setIsShoppingListLoading(false);
        }
      };

      generateList();
    }, 1000); // 1 second debounce

    setDebounceTimeout(timeoutId);

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [mealPlan, pantryItems, preferences.shoppingStores, currentWeekStart]);
  

  const handleToggleFavorite = useCallback((recipeId: string, mealDate?: string, mealType?: MealType, recipeToAdd?: Recipe) => {
    const isFavorite = cookbook.some(r => r.id === recipeId);
    let updatedCookbook = [...cookbook];
    let recipeToToggle = cookbook.find(r => r.id === recipeId) || mealPlan.find(m => m.recipe?.id === recipeId)?.recipe || recipeToAdd;

    if (!recipeToToggle) return;
    
    if (isFavorite) {
      updatedCookbook = cookbook.filter(r => r.id !== recipeId);
    } else {
      updatedCookbook.push({ ...recipeToToggle, isFavorite: true });
    }
    
    setCookbook(updatedCookbook);

    setMealPlan(currentPlan =>
      currentPlan.map(item =>
        item.recipe?.id === recipeId
          ? { ...item, recipe: { ...item.recipe, isFavorite: !isFavorite } }
          : item
      )
    );
  }, [cookbook, mealPlan]);

  const handleGenerateTargetedMeals = async (day: Date, mealType: MealType, scope: 'This Meal Only' | 'All Meal Types' | 'Rest of Today', cookingMethod: string, timeAvailable: string, weekStart: Date) => {
    const slotKey = `${day.toISOString().split('T')[0]}-${mealType}`;
    setLoadingSlots(s => [...s, slotKey]);
    try {
        const weekKey = weekStart.toISOString().split('T')[0];
        const weeklyPrefsForGeneration = weeklyPreferencesByWeek[weekKey] || '';
        const recipes = await generateTargetedRecipes(preferences, pantryItems, energyLevel, mealType, 1, cookingMethod, timeAvailable, weeklyPrefsForGeneration);
        if (recipes.length > 0) {
            const newMeal: MealPlanItem = { date: day.toISOString().split('T')[0], mealType, recipe: { ...recipes[0], isFavorite: cookbook.some(r => r.id === recipes[0].id) }, prepTasks: [] };
            setMealPlan(mp => [...mp.filter(m => m.date !== newMeal.date || m.mealType !== newMeal.mealType), newMeal]);
        }
    } catch(e) {
        console.error(e);
        setFailedSlots(fs => ({...fs, [slotKey]: (e as Error).message }));
    } finally {
        setLoadingSlots(s => s.filter(i => i !== slotKey));
    }
  };

  const onGenerateWeek = async (days: Date[]) => {
      setIsLoading(true);
      setFailedSlots({});
      const dateStrings = days.map(d => d.toISOString().split('T')[0]);
      let newMealPlan = mealPlan.filter(item => !dateStrings.includes(item.date));
      
      const currentWeekKey = currentWeekStart.toISOString().split('T')[0];
      const weeklyPrefsForGeneration = weeklyPreferencesByWeek[currentWeekKey] || '';

      for (const mealType of ['Breakfast', 'Lunch', 'Snack', 'Dinner'] as MealType[]) {
        const planningPrefs = preferences.mealPlanning[mealType.toLowerCase() as keyof MealPlanningPreferences];
        if (!planningPrefs) continue;
        
        const count = planningPrefs.mode === 'batch' ? planningPrefs.batchMeals : days.length;
        if (count === 0) continue;

        try {
            const recipes = await generateRecipes(preferences, pantryItems, energyLevel, mealType, count, weeklyPrefsForGeneration, planningPrefs.mode === 'batch');
            const favoritedRecipes = recipes.map(r => ({ ...r, isFavorite: cookbook.some(cr => cr.id === r.id)}));

            if (planningPrefs.mode === 'batch') {
                days.forEach(day => {
                    const recipeForDay = favoritedRecipes[day.getDay() % favoritedRecipes.length];
                    newMealPlan.push({ date: day.toISOString().split('T')[0], mealType, recipe: recipeForDay, prepTasks: [] });
                });
            } else { // Variety
                days.forEach((day, index) => {
                    if (favoritedRecipes[index]) {
                        newMealPlan.push({ date: day.toISOString().split('T')[0], mealType, recipe: favoritedRecipes[index], prepTasks: [] });
                    }
                });
            }
        } catch (e) {
            console.error(`Failed to generate ${mealType} for the week`, e);
            setFailedSlots(fs => ({...fs, [`${currentWeekStart.toISOString().split('T')[0]}-${mealType}`]: (e as Error).message}))
        }
      }

      setMealPlan(newMealPlan);
      setIsLoading(false);
  };
  
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
      case View.MealPlan: {
        const currentWeekKey = currentWeekStart.toISOString().split('T')[0];
        const currentWeeklyPreferences = weeklyPreferencesByWeek[currentWeekKey] || '';
        const setCurrentWeeklyPreferences = (prefs: string) => {
          setWeeklyPreferencesByWeek(prev => ({
            ...prev,
            [currentWeekKey]: prefs
          }));
        };

        return <MealPlan 
          mealPlan={mealPlan}
          preferences={preferences}
          cookbook={cookbook}
          onGenerateWeek={onGenerateWeek}
          onToggleTask={(mealDate, mealType, taskId) => {/* implement */}}
          onToggleFavorite={handleToggleFavorite}
          isLoading={isLoading}
          onGenerateToday={async () => {
            const today = new Date();
            const weekStartForToday = getStartOfWeekForDate(today);
            const weekKey = weekStartForToday.toISOString().split('T')[0];
            const weeklyPrefsForToday = weeklyPreferencesByWeek[weekKey] || '';

            const meals = await generateDayMeals(preferences, pantryItems, energyLevel, weeklyPrefsForToday);
            const todayString = new Date().toISOString().split('T')[0];
            const newItems: MealPlanItem[] = Object.entries(meals).map(([type, recipe]) => ({
              date: todayString,
              mealType: type.charAt(0).toUpperCase() + type.slice(1) as MealType,
              recipe: {...recipe, isFavorite: cookbook.some(r => r.id === recipe.id)},
              prepTasks: []
            }));
            setMealPlan(mp => [...mp.filter(i => i.date !== todayString), ...newItems]);
          }}
          onFillMealType={async (mealType, weekStart) => { /* implement */ }}
          onGenerateTargetedMeals={handleGenerateTargetedMeals}
          loadingSlots={loadingSlots}
          failedSlots={failedSlots}
          onClearFailedSlot={(slotKey) => setFailedSlots(fs => { const newFs = {...fs}; delete newFs[slotKey]; return newFs; })}
          weeklyPreferences={currentWeeklyPreferences}
          setWeeklyPreferences={setCurrentWeeklyPreferences}
          onUpdateBatchAssignments={(recipeId, mealType, newDates) => {
            setMealPlan(mp => {
              const otherMeals = mp.filter(item => item.recipe?.id !== recipeId || item.mealType !== mealType);
              const recipe = mp.find(item => item.recipe?.id === recipeId)?.recipe;
              if (!recipe) return mp;
              const newAssignments = newDates.map(date => ({ date, mealType, recipe, prepTasks: [] as PrepStep[]}));
              return [...otherMeals, ...newAssignments];
            });
          }}
          currentWeekStart={currentWeekStart}
          setCurrentWeekStart={setCurrentWeekStart}
          weekDaySelections={weekDaySelections}
          setWeekDaySelections={setWeekDaySelections}
          onRemoveMeal={(recipeId, mealType, weekStart) => {
            setMealPlan(mp => mp.filter(item => !(item.recipe?.id === recipeId && item.mealType === mealType)));
          }}
          onRegenerateAndReplace={async (mealType, oldRecipeId, customInstructions) => {
            const oldMeal = mealPlan.find(m => m.recipe?.id === oldRecipeId && m.mealType === mealType);
            if (!oldMeal) return;
            const newRecipe = await generateSingleMeal(preferences, pantryItems, energyLevel, mealType, 'Any', 'No Limit', customInstructions);
            setMealPlan(mp => mp.map(item => item.recipe?.id === oldRecipeId && item.mealType === mealType ? {...item, recipe: {...newRecipe, isFavorite: cookbook.some(r=> r.id === newRecipe.id)} } : item));
          }}
          onReplaceWithCookbook={(mealType, oldRecipeId, newRecipe, weekStart) => {
             setMealPlan(mp => mp.map(item => item.recipe?.id === oldRecipeId && item.mealType === mealType ? {...item, recipe: newRecipe } : item));
          }}
          onGenerateBatch={async (mealType, days) => { /* implement */}}
          onResetWeek={(days) => {
            const dateStrings = new Set(days.map(d => d.toISOString().split('T')[0]));
            setMealPlan(mp => mp.filter(item => !dateStrings.has(item.date)));
          }}
        />;
      }
      case View.Pantry:
        return <Pantry 
          pantryItems={pantryItems}
          onAddItem={({name, category}) => setPantryItems(p => [...p, { id: uuidv4(), name, category, inStock: false }])}
          onDeleteItem={(id) => setPantryItems(p => p.filter(i => i.id !== id))}
          onToggleStock={(id) => setPantryItems(p => p.map(i => i.id === id ? {...i, inStock: !i.inStock} : i))}
          onUpdateItem={(id, updates) => setPantryItems(p => p.map(i => i.id === id ? {...i, ...updates} : i))}
          onBatchUpdate={(items) => {
            const newPantryItems = [...pantryItems];
            items.forEach(scannedItem => {
              const existing = newPantryItems.find(p => p.name.toLowerCase() === scannedItem.name.toLowerCase());
              if (!existing) {
                newPantryItems.push({ id: uuidv4(), name: scannedItem.name, category: scannedItem.category, inStock: true });
              } else if (!existing.inStock) {
                existing.inStock = true;
              }
            });
            setPantryItems(newPantryItems);
          }}
        />;
      case View.ShoppingList:
        return <ShoppingList 
          items={shoppingList}
          storeOptions={preferences.shoppingStores}
          onAddItem={(item) => setShoppingList(sl => [...sl, {...item, id: uuidv4(), isGenerated: false, isChecked: false, isOptional: false }])}
          onUpdateItem={(id, updates) => setShoppingList(sl => sl.map(i => i.id === id ? {...i, ...updates} : i))}
          onDeleteItem={(id) => setShoppingList(sl => sl.filter(i => i.id !== id))}
          onClearChecked={() => setShoppingList(sl => sl.filter(i => !i.isChecked))}
          isLoading={isShoppingListLoading}
        />;
      case View.Preferences:
        return <Preferences preferences={preferences} onSave={(newPrefs) => {
            if (newPrefs.shoppingStores.toString() !== preferences.shoppingStores.toString()) {
                // If stores change, re-evaluate custom stores in shopping list
                const standardStores = new Set(newPrefs.shoppingStores);
                setShoppingList(sl => sl.map(item => {
                    if (!item.isGenerated && !standardStores.has(item.store)) {
                        // Keep custom store value
                        return item;
                    }
                     if (!standardStores.has(item.store)) {
                        // Reset generated item's store to a default if it's no longer valid
                        return {...item, store: newPrefs.shoppingStores[0] || 'Other'};
                    }
                    return item;
                }));
            }
            setPreferences(newPrefs);
        }} theme={theme} onThemeChange={setTheme} />;
      case View.FridgeRescue:
        return <FridgeRescue preferences={preferences} />;
      case View.Cookbook:
        return <Cookbook cookbook={cookbook} onToggleFavorite={handleToggleFavorite} />;
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

  return (
    <div className={`theme-${theme}`}>
      <div className="flex h-screen bg-background-primary text-text-primary">
        {/* Mobile Sidebar (Drawer) */}
        {isSidebarOpen && (
          <div className="md:hidden fixed inset-0 flex z-40" role="dialog" aria-modal="true">
            <div className="fixed inset-0 bg-black bg-opacity-60" aria-hidden="true" onClick={() => setIsSidebarOpen(false)}></div>
            <div className="relative flex-1 flex flex-col max-w-xs w-full bg-background-primary">
              <div className="absolute top-0 right-0 -mr-12 pt-2">
                <button
                  type="button"
                  className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                  onClick={() => setIsSidebarOpen(false)}
                >
                  <span className="sr-only">Close sidebar</span>
                  <Icon name="x" className="h-6 w-6 text-white" />
                </button>
              </div>
              <div className="flex items-center justify-center h-20 border-b border-neutral-medium/20">
                 <span className="text-2xl font-bold font-heading text-primary">Mindful Meals</span>
              </div>
              <nav className="flex-1 px-4 py-6 space-y-2">
                {NAV_ITEMS.map(item => (
                  <button
                    key={item.view}
                    onClick={() => {
                      setCurrentView(item.view);
                      setIsSidebarOpen(false);
                    }}
                    className={`w-full flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${currentView === item.view ? 'bg-primary/20 text-primary' : 'text-text-secondary hover:bg-neutral-light/50'}`}
                  >
                    <Icon name={item.icon} className="mr-3 w-6 h-6" />
                    {item.label}
                  </button>
                ))}
              </nav>
            </div>
            <div className="flex-shrink-0 w-14" aria-hidden="true"></div>
          </div>
        )}

        {/* Desktop Sidebar */}
        <div className={`hidden md:flex md:flex-shrink-0`}>
          <div className="flex flex-col w-64">
            <div className="flex items-center justify-center h-20 border-b border-neutral-medium/20">
              <span className="text-2xl font-bold font-heading text-primary">Mindful Meals</span>
            </div>
            <nav className="flex-1 px-4 py-6 space-y-2">
              {NAV_ITEMS.map(item => (
                <button
                  key={item.view}
                  onClick={() => setCurrentView(item.view)}
                  className={`w-full flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${currentView === item.view ? 'bg-primary/20 text-primary' : 'text-text-secondary hover:bg-neutral-light/50'}`}
                >
                  <Icon name={item.icon} className="mr-3 w-6 h-6" />
                  {item.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        <div className="flex flex-col flex-1 w-0 overflow-hidden">
           <div className="relative z-10 flex-shrink-0 flex h-16 bg-background-primary shadow md:hidden">
              <button
                type="button"
                className="px-4 border-r border-neutral-medium/20 text-text-secondary focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary"
                onClick={() => setIsSidebarOpen(true)}
              >
                <span className="sr-only">Open sidebar</span>
                <svg className="h-6 w-6" stroke="currentColor" fill="none" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7" />
                </svg>
              </button>
              <div className="flex-1 px-4 flex justify-between items-center">
                 <h1 className="text-xl font-bold font-heading text-primary">{NAV_ITEMS.find(i => i.view === currentView)?.label}</h1>
              </div>
          </div>
          <main className="flex-1 relative overflow-y-auto focus:outline-none">
            {renderView()}
          </main>
        </div>
      </div>
    </div>
  );
}

export default App;