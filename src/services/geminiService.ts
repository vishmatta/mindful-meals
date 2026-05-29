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
    return apiPost('/api/recipes/generate', { mode: 'weeklyPlan', preferences, pantry, energyLevel, weeklyPreferences });
};

export const generateDayMeals = async (
    preferences: DietaryPreferences,
    pantry: Ingredient[],
    energyLevel: EnergyLevel,
    weeklyPreferences: string,
): Promise<{ breakfast: Recipe; lunch: Recipe; snack: Recipe; dinner: Recipe; }> => {
    return apiPost('/api/recipes/generate', { mode: 'dayMeals', preferences, pantry, energyLevel, weeklyPreferences });
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
    return apiPost('/api/recipes/generate', { mode: 'recipes', preferences, pantry, energyLevel, mealType, count, weeklyPreferences, isBatch });
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
    return apiPost('/api/recipes/generate', { mode: 'targeted', preferences, pantry, energyLevel, mealType, count, cookingMethod, timeAvailable, weeklyPreferences });
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
    return apiPost('/api/recipes/generate', { mode: 'single', preferences, pantry, energyLevel, mealType, cookingMethod, timeAvailable, customInstructions });
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
