export enum View {
  Dashboard = 'DASHBOARD',
  MealPlan = 'MEAL_PLAN',
  Pantry = 'PANTRY',
  ShoppingList = 'SHOPPING_LIST',
  Preferences = 'PREFERENCES',
  FridgeRescue = 'FRIDGE_RESCUE',
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

export interface DietaryPreferences {
  globalRestrictions: string[];
  weeklyCustomizations: string[];
  equipment: string[];
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
  ingredients: (Omit<Ingredient, 'id' | 'category' | 'inStock'> & { quantity: number; unit: string })[];
  prepSteps: Omit<PrepStep, 'id'|'completed'>[];
  cookingTimeMinutes: number;
  totalTimeMinutes: number;
  energyLevel: EnergyLevel;
  cleanupLevel: 'low' | 'medium' | 'high';
}

export interface MealPlanItem {
  date: string; // YYYY-MM-DD
  mealType: 'Breakfast' | 'Lunch' | 'Dinner';
  recipe: Recipe | null;
  prepTasks: PrepStep[];
}

export interface ShoppingListItem {
    name: string;
    quantity: number;
    unit: string;
}