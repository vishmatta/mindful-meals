import { DietaryPreferences, EnergyLevel, Ingredient, MealPlanItem, View } from './types';

export const ENERGY_LEVELS = {
  [EnergyLevel.FullPower]: { label: 'Full Power', color: 'bg-green-500', description: 'Ready for a complex recipe!' },
  [EnergyLevel.Cruising]: { label: 'Cruising', color: 'bg-blue-500', description: 'Good for standard meal prep.' },
  [EnergyLevel.LowBattery]: { label: 'Low Battery', color: 'bg-yellow-500', description: 'Need something quick and easy.' },
  [EnergyLevel.SOS]: { label: 'SOS', color: 'bg-red-500', description: '5-minute emergency meals only.' },
};

export const PANTRY_CATEGORIES = [
  'Produce',
  'Dairy, Eggs & Cheese',
  'Meat',
  'Seafood',
  'Breads & Cereals',
  'Pasta, Rice & Beans',
  'Canned Foods & Soups',
  'Frozen Foods',
  'Oils & Dressings',
  'Sauces & Condiments',
  'Spices & Seasonings',
  'Baking Items',
  'Snacks & Candy',
  'Beverages',
  'Coffee & Tea',
  'Personal Care & Health',
];

export const INITIAL_PREFERENCES: DietaryPreferences = {
  globalRestrictions: ['Shellfish'],
  weeklyCustomizations: ['No red meat this week', 'Craving Italian food'],
  equipment: ['Air Fryer', 'Oven', 'Stovetop', 'Microwave'],
};

export const INITIAL_PANTRY: Ingredient[] = [
  { id: '1', name: 'Chicken Breast', category: 'Meat', inStock: true },
  { id: '2', name: 'Olive Oil', category: 'Oils & Dressings', inStock: true },
  { id: '3', name: 'Garlic', category: 'Produce', inStock: true },
  { id: '4', name: 'Onion', category: 'Produce', inStock: true },
  { id: '5', name: 'Pasta', category: 'Pasta, Rice & Beans', inStock: false },
  { id: '6', name: 'Canned Tomatoes', category: 'Canned Foods & Soups', inStock: true },
];

export const INITIAL_MEAL_PLAN: MealPlanItem[] = [];

export const NAV_ITEMS = [
  { view: View.Dashboard, label: 'Dashboard', icon: 'home' },
  { view: View.MealPlan, label: 'Meal Plan', icon: 'calendar' },
  { view: View.Pantry, label: 'Pantry', icon: 'pantry' },
  { view: View.ShoppingList, label: 'Shopping List', icon: 'list' },
  { view: View.FridgeRescue, label: 'Fridge Rescue', icon: 'rescue' },
  { view: View.Preferences, label: 'Preferences', icon: 'settings' },
];