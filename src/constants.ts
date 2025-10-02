

import { DietaryPreferences, EnergyLevel, Ingredient, MealPlanItem, View } from './types';

export const ENERGY_LEVELS = {
  [EnergyLevel.FullPower]: { label: 'Full Power', color: 'bg-energy-full-power', description: 'Ready for a complex recipe!' },
  [EnergyLevel.Cruising]: { label: 'Cruising', color: 'bg-energy-cruising', description: 'Good for standard meal prep.' },
  [EnergyLevel.LowBattery]: { label: 'Low Battery', color: 'bg-energy-low-battery', description: 'Need something quick and easy.' },
  [EnergyLevel.SOS]: { label: 'SOS', color: 'bg-energy-sos', description: '5-minute emergency meals only.' },
};

export const PANTRY_CATEGORIES = [
  'Beverages',
  'Coffee & Tea',
  'Breads & Cereals',
  'Canned & Jarred Foods',
  'Dairy, Eggs & Cheese',
  'Frozen Vegetables',
  'Frozen Meals & Snacks',
  'Meat & Poultry',
  'Seafood',
  'Cooking Oils & Vinegars',
  'Condiments & Dressings',
  'Grains & Rice',
  'Legumes & Pulses',
  'Pasta & Noodles',
  'Nuts & Seeds',
  'Produce',
  'Sauces & Spreads',
  'Snacks & Bars',
  'Spices, Herbs & Masalas',
  'Baking & Sweeteners',
  'Personal Care & Health',
];

export const INITIAL_PREFERENCES: DietaryPreferences = {
  globalRestrictions: ['Beef', 'Pork'],
  equipment: ['Air Fryer', 'Oven', 'Stovetop', 'Microwave'],
  cuisinePreferences: [],
  shoppingStores: ["Costco", "HEB", "Randall's", "Amazon", "Target", "Indian Store", "Other"],
  mealPlanning: {
    breakfast: { mode: 'variety', batchMeals: 1 },
    lunch: { mode: 'batch', batchMeals: 2 },
    snack: { mode: 'variety', batchMeals: 1 },
    dinner: { mode: 'batch', batchMeals: 2 },
  }
};

export const INITIAL_PANTRY: Ingredient[] = [
  // Beverages
  { id: '1', name: 'Coke Zero', category: 'Beverages', inStock: false },
  { id: '2', name: 'Fanta Zero', category: 'Beverages', inStock: false },
  { id: '3', name: 'Sprite Zero', category: 'Beverages', inStock: false },
  { id: '4', name: 'Mango Nectar', category: 'Beverages', inStock: false },
  { id: '5', name: 'Protein shakes', category: 'Beverages', inStock: true },

  // Coffee & Tea
  { id: '15', name: 'Decaf espresso pods', category: 'Coffee & Tea', inStock: false },
  { id: '16', name: 'Espresso pods', category: 'Coffee & Tea', inStock: false },
  { id: '17', name: 'Café Bustelo (non-instant) powder', category: 'Coffee & Tea', inStock: true },
  { id: '18', name: 'Filter coffee liquid', category: 'Coffee & Tea', inStock: true },
  { id: '19', name: 'K-cup pods', category: 'Coffee & Tea', inStock: true },

  // Breads & Cereals
  { id: '6', name: 'Bagels', category: 'Breads & Cereals', inStock: false },
  { id: '7', name: 'Bread', category: 'Breads & Cereals', inStock: false },
  { id: '8', name: 'Burger buns', category: 'Breads & Cereals', inStock: false },
  { id: '9', name: 'Gyro pita bread', category: 'Breads & Cereals', inStock: false },
  { id: '10', name: 'Tortillas', category: 'Breads & Cereals', inStock: false },
  { id: '11', name: 'Parathas', category: 'Breads & Cereals', inStock: false },
  { id: '12', name: 'Old-fashioned oats', category: 'Breads & Cereals', inStock: true },
  { id: '13', name: 'Taco shells', category: 'Breads & Cereals', inStock: true },
  
  // Canned & Jarred Foods
  { id: '14', name: 'Tomato puree', category: 'Canned & Jarred Foods', inStock: true },
  
  // Dairy, Eggs & Cheese
  { id: '20', name: 'Cheese slices', category: 'Dairy, Eggs & Cheese', inStock: false },
  { id: '21', name: 'Cream cheese', category: 'Dairy, Eggs & Cheese', inStock: false },
  { id: '22', name: 'Low-fat cheese', category: 'Dairy, Eggs & Cheese', inStock: false },
  { id: '23', name: 'Queso', category: 'Dairy, Eggs & Cheese', inStock: false },
  { id: '24', name: 'Paneer', category: 'Dairy, Eggs & Cheese', inStock: true },
  { id: '25', name: 'Milk', category: 'Dairy, Eggs & Cheese', inStock: false },
  { id: '26', name: 'Greek yogurt', category: 'Dairy, Eggs & Cheese', inStock: true },
  { id: '27', name: 'Light sour cream', category: 'Dairy, Eggs & Cheese', inStock: true },
  { id: '28', name: 'Whipped cream cheese spread', category: 'Dairy, Eggs & Cheese', inStock: false },
  { id: '29', name: 'Eggs', category: 'Dairy, Eggs & Cheese', inStock: false },
  { id: '30', name: 'Butter sticks', category: 'Dairy, Eggs & Cheese', inStock: true },
  { id: '31', name: 'Light butter spread', category: 'Dairy, Eggs & Cheese', inStock: true },

  // Frozen Vegetables
  { id: '32', name: 'Baby lima beans', category: 'Frozen Vegetables', inStock: false },
  { id: '33', name: 'Frozen harvest blend vegetables', category: 'Frozen Vegetables', inStock: false },
  { id: '34', name: 'Frozen peas and carrots', category: 'Frozen Vegetables', inStock: false },
  { id: '35', name: 'Frozen spinach', category: 'Frozen Vegetables', inStock: false },
  { id: '36', name: 'Frozen broccoli', category: 'Frozen Vegetables', inStock: true },
  { id: '37', name: 'Frozen cauliflower florets', category: 'Frozen Vegetables', inStock: true },
  { id: '38', name: 'Frozen green beans (cut)', category: 'Frozen Vegetables', inStock: true },
  { id: '39', name: 'Frozen green peas', category: 'Frozen Vegetables', inStock: true },
  { id: '40', name: 'Frozen mixed vegetables', category: 'Frozen Vegetables', inStock: true },
  { id: '41', name: 'Frozen okra', category: 'Frozen Vegetables', inStock: true },
  { id: '42', name: 'Frozen whole kernel corn', category: 'Frozen Vegetables', inStock: true },

  // Frozen Meals & Snacks
  { id: '43', name: 'Frozen chicken lasagna', category: 'Frozen Meals & Snacks', inStock: false },
  { id: '44', name: 'Frozen chicken patties', category: 'Frozen Meals & Snacks', inStock: false },
  { id: '45', name: 'Frozen turkey burgers', category: 'Frozen Meals & Snacks', inStock: false },
  { id: '46', name: 'Frozen black bean burger patties', category: 'Frozen Meals & Snacks', inStock: false },
  { id: '47', name: 'Frozen chicken melts', category: 'Frozen Meals & Snacks', inStock: true },
  { id: '48', name: 'Frozen popcorn chicken', category: 'Frozen Meals & Snacks', inStock: true },
  { id: '49', name: 'Eggo waffles', category: 'Frozen Meals & Snacks', inStock: true },
  { id: '50', name: 'Mix veg paratha', category: 'Frozen Meals & Snacks', inStock: true },

  // Meat & Poultry
  { id: '51', name: 'Goat', category: 'Meat & Poultry', inStock: false },
  { id: '52', name: 'Chicken breasts', category: 'Meat & Poultry', inStock: true },
  { id: '53', name: 'Lean ground chicken', category: 'Meat & Poultry', inStock: true },
  { id: '54', name: 'Lean ground turkey', category: 'Meat & Poultry', inStock: true },
  { id: '55', name: 'Turkey deli meat', category: 'Meat & Poultry', inStock: false },
  
  // Seafood
  { id: '147', name: 'Salmon', category: 'Seafood', inStock: true },
  { id: '148', name: 'Shrimp', category: 'Seafood', inStock: true },
  
  // Cooking Oils & Vinegars
  { id: '57', name: 'Canola oil', category: 'Cooking Oils & Vinegars', inStock: true },
  { id: '59', name: 'Coconut oil', category: 'Cooking Oils & Vinegars', inStock: true },
  { id: '60', name: 'Peanut oil', category: 'Cooking Oils & Vinegars', inStock: true },
  { id: '61', name: 'Extra virgin olive oil', category: 'Cooking Oils & Vinegars', inStock: true },
  { id: '62', name: 'Ghee', category: 'Cooking Oils & Vinegars', inStock: true },
  { id: '63', name: 'Distilled white vinegar (5%)', category: 'Cooking Oils & Vinegars', inStock: true },
  
  // Condiments & Dressings
  { id: '56', name: 'Light mayo', category: 'Condiments & Dressings', inStock: true },
  { id: '58', name: 'Ranch', category: 'Condiments & Dressings', inStock: true },
  
  // Grains & Rice
  { id: '68', name: 'Basmati rice', category: 'Grains & Rice', inStock: true },
  { id: '71', name: 'Sona Masoori rice', category: 'Grains & Rice', inStock: true },
  { id: '72', name: 'Quinoa', category: 'Grains & Rice', inStock: true },
  { id: '159', name: 'Red poha', category: 'Grains & Rice', inStock: true },

  // Legumes & Pulses
  { id: '64', name: 'Chickpeas', category: 'Legumes & Pulses', inStock: false },
  { id: '65', name: 'Pinto beans', category: 'Legumes & Pulses', inStock: false },
  { id: '67', name: 'Black beans', category: 'Legumes & Pulses', inStock: true },
  { id: '69', name: 'Toor dal', category: 'Legumes & Pulses', inStock: true },
  { id: '70', name: 'Yellow vatana', category: 'Legumes & Pulses', inStock: true },
  
  // Pasta & Noodles
  { id: '73', name: 'Angel hair pasta', category: 'Pasta & Noodles', inStock: true },
  { id: '75', name: 'Veg hakka noodles', category: 'Pasta & Noodles', inStock: true },

  // Nuts & Seeds
  { id: '66', name: 'Unsalted cashew nuts', category: 'Nuts & Seeds', inStock: false },
  { id: '74', name: 'Jumbo peanuts', category: 'Nuts & Seeds', inStock: true },

  // Produce
  { id: '76', name: 'Apples', category: 'Produce', inStock: false },
  { id: '77', name: 'Avocados', category: 'Produce', inStock: false },
  { id: '78', name: 'Bananas', category: 'Produce', inStock: false },
  { id: '79', name: 'Cabbage', category: 'Produce', inStock: false },
  { id: '80', name: 'Carrots', category: 'Produce', inStock: false },
  { id: '81', name: 'Cilantro', category: 'Produce', inStock: false },
  { id: '82', name: 'Green onions', category: 'Produce', inStock: false },
  { id: '83', name: 'Green peppers', category: 'Produce', inStock: false },
  { id: '84', name: 'Lemon', category: 'Produce', inStock: false },
  { id: '85', name: 'Lime', category: 'Produce', inStock: false },
  { id: '86', name: 'Mint', category: 'Produce', inStock: false },
  { id: '87', name: 'Okra', category: 'Produce', inStock: false },
  { id: '88', name: 'Orange pepper', category: 'Produce', inStock: false },
  { id: '89', name: 'Potatoes', category: 'Produce', inStock: false },
  { id: '90', name: 'Red onions', category: 'Produce', inStock: false },
  { id: '91', name: 'Serrano peppers', category: 'Produce', inStock: false },
  { id: '92', name: 'Shredded iceberg lettuce', category: 'Produce', inStock: false },
  { id: '93', name: 'Spinach', category: 'Produce', inStock: false },
  { id: '94', name: 'Tomatoes', category: 'Produce', inStock: false },
  { id: '95', name: 'Garlic', category: 'Produce', inStock: true },
  { id: '96', name: 'Tamarind', category: 'Produce', inStock: true },

  // Sauces & Spreads
  { id: '97', name: 'Peanut butter', category: 'Sauces & Spreads', inStock: false },
  { id: '98', name: 'Hazelnut chocolate spread', category: 'Sauces & Spreads', inStock: true },
  { id: '99', name: 'Classic hazelnut syrup', category: 'Sauces & Spreads', inStock: true },
  { id: '100', name: 'Vanilla syrup', category: 'Sauces & Spreads', inStock: true },
  { id: '101', name: 'Honey', category: 'Sauces & Spreads', inStock: true },
  { id: '102', name: 'Pizza sauce', category: 'Sauces & Spreads', inStock: true },
  { id: '103', name: 'Roasted garlic alfredo pasta sauce', category: 'Sauces & Spreads', inStock: true },
  { id: '104', name: 'Herdez guacamole salsa – medium', category: 'Sauces & Spreads', inStock: false },
  { id: '105', name: 'Herdez chipotle salsa cremosa', category: 'Sauces & Spreads', inStock: true },
  { id: '106', name: 'Schezwan chutney', category: 'Sauces & Spreads', inStock: false },
  { id: '107', name: 'Chili garlic sauce', category: 'Sauces & Spreads', inStock: true },
  { id: '108', name: 'Soy sauce', category: 'Sauces & Spreads', inStock: true },
  { id: '109', name: 'Sriracha sauce', category: 'Sauces & Spreads', inStock: true },
  { id: '110', name: 'Hot sauce', category: 'Sauces & Spreads', inStock: false },

  // Snacks & Bars
  { id: '111', name: 'Protein bars', category: 'Snacks & Bars', inStock: false },
  { id: '112', name: 'Chips', category: 'Snacks & Bars', inStock: true },

  // Spices, Herbs & Masalas
  { id: '113', name: 'Black cardamom', category: 'Spices, Herbs & Masalas', inStock: true },
  { id: '114', name: 'Green cardamom', category: 'Spices, Herbs & Masalas', inStock: true },
  { id: '115', name: 'Black peppercorns', category: 'Spices, Herbs & Masalas', inStock: true },
  { id: '116', name: 'Cinnamon stick (flat)', category: 'Spices, Herbs & Masalas', inStock: true },
  { id: '117', name: 'Cloves (whole)', category: 'Spices, Herbs & Masalas', inStock: true },
  { id: '118', name: 'Mace', category: 'Spices, Herbs & Masalas', inStock: true },
  { id: '119', name: 'Star anise', category: 'Spices, Herbs & Masalas', inStock: true },
  { id: '120', name: 'Shajeera', category: 'Spices, Herbs & Masalas', inStock: false },
  { id: '121', name: 'Mustard seeds', category: 'Spices, Herbs & Masalas', inStock: true },
  { id: '122', name: 'Poppy seeds', category: 'Spices, Herbs & Masalas', inStock: true },
  { id: '123', name: 'Curry leaves', category: 'Spices, Herbs & Masalas', inStock: false },
  { id: '124', name: 'Fenugreek seeds', category: 'Spices, Herbs & Masalas', inStock: true },
  { id: '125', name: 'Kashmiri chili', category: 'Spices, Herbs & Masalas', inStock: true },
  { id: '126', name: 'Red chili powder', category: 'Spices, Herbs & Masalas', inStock: true },
  { id: '127', name: 'Red chili whole', category: 'Spices, Herbs & Masalas', inStock: true },
  { id: '128', name: 'Coriander powder', category: 'Spices, Herbs & Masalas', inStock: true },
  { id: '129', name: 'Turmeric powder', category: 'Spices, Herbs & Masalas', inStock: true },
  { id: '130', name: 'Garlic powder', category: 'Spices, Herbs & Masalas', inStock: true },
  { id: '131', name: 'Ginger-garlic paste', category: 'Spices, Herbs & Masalas', inStock: true },
  { id: '132', name: 'Hing powder', category: 'Spices, Herbs & Masalas', inStock: true },
  { id: '133', name: 'Kasoori methi', category: 'Spices, Herbs & Masalas', inStock: true },
  { id: '134', name: 'Rubbed sage', category: 'Spices, Herbs & Masalas', inStock: true },
  { id: '135', name: 'Dried chives', category: 'Spices, Herbs & Masalas', inStock: true },
  { id: '136', name: 'Dry coconut (shredded)', category: 'Spices, Herbs & Masalas', inStock: true },
  { id: '137', name: 'Dagar phool', category: 'Spices, Herbs & Masalas', inStock: true },
  { id: '138', name: 'Garam masala', category: 'Spices, Herbs & Masalas', inStock: true },
  { id: '139', name: 'Chhole masala', category: 'Spices, Herbs & Masalas', inStock: true },
  { id: '140', name: 'Everest pav bhaji masala', category: 'Spices, Herbs & Masalas', inStock: true },
  { id: '141', name: 'Everest tandoori chicken masala', category: 'Spices, Herbs & Masalas', inStock: true },
  { id: '142', name: 'Chowmein hakka noodles masala spices', category: 'Spices, Herbs & Masalas', inStock: true },
  { id: '143', name: 'Rasam powder', category: 'Spices, Herbs & Masalas', inStock: true },
  { id: '144', name: 'Sambar powder', category: 'Spices, Herbs & Masalas', inStock: true },
  { id: '145', name: 'Salt', category: 'Spices, Herbs & Masalas', inStock: true },

  // Baking & Sweeteners
  { id: '146', name: 'All-purpose flour', category: 'Baking & Sweeteners', inStock: true },
  { id: '149', name: 'Whole wheat flour', category: 'Baking & Sweeteners', inStock: true },
  { id: '150', name: 'Baking powder', category: 'Baking & Sweeteners', inStock: true },
  { id: '151', name: 'Baking soda', category: 'Baking & Sweeteners', inStock: true },
  { id: '152', name: 'Cornstarch', category: 'Baking & Sweeteners', inStock: true },
  { id: '153', name: 'Pure vanilla extract', category: 'Baking & Sweeteners', inStock: true },
  { id: '154', name: 'Cacao powder', category: 'Baking & Sweeteners', inStock: true },
  { id: '155', name: 'Semi-sweet mini chocolate chips', category: 'Baking & Sweeteners', inStock: true },
  { id: '156', name: 'Chocolate Jell-O pudding powder', category: 'Baking & Sweeteners', inStock: true },
  { id: '157', name: 'Brown stevia', category: 'Baking & Sweeteners', inStock: false },

  // Personal Care & Health
  { id: '158', name: 'Organic plant protein powder', category: 'Personal Care & Health', inStock: true },
];

export const INITIAL_MEAL_PLAN: MealPlanItem[] = [];

export const NAV_ITEMS = [
  { view: View.Dashboard, label: 'Dashboard', icon: 'home' },
  { view: View.MealPlan, label: 'Meal Plan', icon: 'calendar' },
  { view: View.Cookbook, label: 'My Cookbook', icon: 'book-open' },
  { view: View.Pantry, label: 'Pantry', icon: 'pantry' },
  { view: View.ShoppingList, label: 'Shopping List', icon: 'list' },
  { view: View.FridgeRescue, label: 'Fridge Rescue', icon: 'rescue' },
  { view: View.Preferences, label: 'Preferences', icon: 'settings' },
];