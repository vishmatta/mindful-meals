import { v4 as uuidv4 } from 'uuid';
import { DietaryPreferences, Ingredient, Recipe, EnergyLevel, ScannedItem, ShoppingListItem } from '../types';

async function apiPost<T>(path: string, body: unknown): Promise<T> {
    const res = await fetch(path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(err.error || `Request to ${path} failed with status ${res.status}`);
    }
    return res.json();
}

export const generateMealPlan = async (preferences: DietaryPreferences, pantry: Ingredient[], energyLevel: EnergyLevel, weeklyPreferences: string): Promise<Recipe[]> => {
    const recipes = await apiPost<Omit<Recipe, 'id'>[]>('/api/recipes/generate', { mode: 'weeklyPlan', preferences, pantry, energyLevel, weeklyPreferences });
    return recipes.map(r => ({ ...r, id: uuidv4() }));
};

export const generateDayMeals = async (
    preferences: DietaryPreferences,
    pantry: Ingredient[],
    energyLevel: EnergyLevel,
    weeklyPreferences: string,
): Promise<{ breakfast: Recipe; lunch: Recipe; snack: Recipe; dinner: Recipe; }> => {
    const meals = await apiPost<{ breakfast: Omit<Recipe, 'id'>; lunch: Omit<Recipe, 'id'>; snack: Omit<Recipe, 'id'>; dinner: Omit<Recipe, 'id'>; }>('/api/recipes/generate', { mode: 'dayMeals', preferences, pantry, energyLevel, weeklyPreferences });
    return {
        breakfast: { ...meals.breakfast, id: uuidv4() },
        lunch: { ...meals.lunch, id: uuidv4() },
        snack: { ...meals.snack, id: uuidv4() },
        dinner: { ...meals.dinner, id: uuidv4() },
    };
};

export const generateRecipes = async (
    preferences: DietaryPreferences,
    pantry: Ingredient[],
    energyLevel: EnergyLevel,
    mealType: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack',
    count: number,
    weeklyPreferences: string,
    isBatch: boolean,
): Promise<Recipe[]> => {
    const recipes = await apiPost<Omit<Recipe, 'id'>[]>('/api/recipes/generate', { mode: 'recipes', preferences, pantry, energyLevel, mealType, count, weeklyPreferences, isBatch });
    return recipes.map(r => ({ ...r, id: uuidv4() }));
};

export const generateTargetedRecipes = async (
    preferences: DietaryPreferences,
    pantry: Ingredient[],
    energyLevel: EnergyLevel,
    mealType: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack',
    count: number,
    cookingMethod: string,
    timeAvailable: string,
    weeklyPreferences: string,
): Promise<Recipe[]> => {
    const recipes = await apiPost<Omit<Recipe, 'id'>[]>('/api/recipes/generate', { mode: 'targeted', preferences, pantry, energyLevel, mealType, count, cookingMethod, timeAvailable, weeklyPreferences });
    return recipes.map(r => ({ ...r, id: uuidv4() }));
};

export const generateSingleMeal = async (
    preferences: DietaryPreferences,
    pantry: Ingredient[],
    energyLevel: EnergyLevel,
    mealType: string,
    cookingMethod: string,
    timeAvailable: string,
    customInstructions: string,
): Promise<Recipe> => {
    const recipe = await apiPost<Omit<Recipe, 'id'>>('/api/recipes/generate', { mode: 'single', preferences, pantry, energyLevel, mealType, cookingMethod, timeAvailable, customInstructions });
    return { ...recipe, id: uuidv4() };
};

export const analyzeFridgeImage = async (base64Image: string, mimeType: string, preferences: DietaryPreferences): Promise<string> => {
    const data = await apiPost<{ text: string }>('/api/fridge/rescue', { base64Image, mimeType, preferences });
    return data.text;
};

export const scanReceipt = async (base64Image: string, mimeType: string): Promise<Omit<ScannedItem, 'isChecked'>[]> => {
    return apiPost('/api/receipts/scan', { base64Image, mimeType });
};

export const generateShoppingList = async (
    recipes: Recipe[],
    pantryItems: Ingredient[],
    storeOptions: string[]
): Promise<Omit<ShoppingListItem, 'id' | 'isGenerated' | 'isChecked'>[]> => {
    return apiPost('/api/shopping-list/generate', { recipes, pantryItems, storeOptions });
};
