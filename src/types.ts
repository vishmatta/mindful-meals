// Fix: Removed circular import of 'View' from the same file, which was causing a compilation error.
export enum View {
  Dashboard = 'DASHBOARD',
  MealPlan = 'MEAL_PLAN',
  Pantry = 'PANTRY',
  ShoppingList = 'SHOPPING_LIST',
  Preferences = 'PREFERENCES',
  FridgeRescue = 'FRIDGE_RESCUE',
  Cookbook = 'COOKBOOK',
}

export enum EnergyLevel {
  FullPower = 'FULL_POWER',
  Cruising = 'CRUISING',
  LowBattery = 'LOW_BATTERY',
  SOS = 'SOS',
}

export interface Ingredient {
  id: string;
  name: string;
  category: string;
  inStock: boolean;
}

export type MealPlanningMode = 'variety' | 'batch';

export interface MealPlanPreference {
  mode: MealPlanningMode;
  batchMeals: number; // Number of different recipes for batch prep, 1-4
}

export interface MealPlanningPreferences {
  breakfast: MealPlanPreference;
  lunch: MealPlanPreference;
  snack: MealPlanPreference;
  dinner: MealPlanPreference;
}

export interface DietaryPreferences {
  globalRestrictions: string[];
  equipment: string[];
  cuisinePreferences: string[];
  shoppingStores: string[];
  mealPlanning: MealPlanningPreferences;
  zipCode: string;
  storeRadius: number;
}

export interface PrepStep {
  id: string;
  task: string;
  durationMinutes: number;
  completed: boolean;
}

export interface Recipe {
  id: string;
  name:string;
  description: string;
  // Fix: The 'ingredients' property should be an array to hold multiple ingredients for a recipe.
  ingredients: (Omit<Ingredient, 'id' | 'category' | 'inStock'> & { quantity: number; unit: string; isOptional: boolean; })[];
  prepSteps: Omit<PrepStep, 'id'|'completed'>[];
  cookingTimeMinutes: number;
  totalTimeMinutes: number;
  energyLevel: EnergyLevel;
  cleanupLevel: 'low' | 'medium' | 'high';
  isFavorite: boolean;
  cuisine: string;
  cookingMethod?: string;
  substitutions?: string[];
}

export interface MealPlanItem {
  date: string; // YYYY-MM-DD
  mealType: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';
  recipe: Recipe | null;
  prepTasks: PrepStep[];
}

export interface ShoppingListItem {
    id: string;
    name: string;
    quantity: number;
    unit: string;
    store: string;
    isGenerated: boolean;
    isChecked: boolean;
    isOptional: boolean;
}

export interface ScannedItem {
  name: string;
  quantity: number;
  unit: string;
  category: string;
  // For the review UI
  isChecked: boolean;
}
