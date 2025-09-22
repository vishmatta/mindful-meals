import { GoogleGenAI, Type, GenerateContentResponse, Modality } from "@google/genai";
import { DietaryPreferences, Ingredient, Recipe, EnergyLevel, ScannedItem } from '../types';
import { PANTRY_CATEGORIES } from "../constants";

// Fix: Initialize GoogleGenAI with API_KEY from environment variables directly as per guidelines.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const recipeSchema = {
    type: Type.OBJECT,
    properties: {
        id: { type: Type.STRING, description: "A unique ID for the recipe" },
        name: { type: Type.STRING },
        description: { type: Type.STRING },
        ingredients: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING },
                    quantity: { type: Type.NUMBER },
                    unit: { type: Type.STRING },
                    isOptional: { type: Type.BOOLEAN, description: "Set to true if this ingredient is not essential for the recipe. Default to false." }
                },
                required: ["name", "quantity", "unit", "isOptional"],
            }
        },
        prepSteps: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    task: { type: Type.STRING, description: "A small, manageable prep task." },
                    durationMinutes: { type: Type.NUMBER, description: "Estimated minutes for the task." },
                },
                required: ["task", "durationMinutes"],
            }
        },
        cookingTimeMinutes: { type: Type.NUMBER },
        totalTimeMinutes: { type: Type.NUMBER },
        // Fix: Replace unsupported 'enum' with 'description' to guide the model on valid values.
        energyLevel: { type: Type.STRING, description: 'The energy level required for the recipe. Must be one of the following values: "FULL_POWER", "CRUISING", "LOW_BATTERY", "SOS"' },
        // Fix: Replace unsupported 'enum' with 'description' to guide the model on valid values.
        cleanupLevel: { type: Type.STRING, description: 'The cleanup level after cooking. Must be one of the following values: "low", "medium", "high"' },
        isFavorite: { type: Type.BOOLEAN, description: "Set to false by default." },
        cuisine: { type: Type.STRING, description: "The cuisine type of the recipe, e.g., Indian, Mexican, Italian." },
        cookingMethod: { type: Type.STRING, description: "The primary cooking method used, e.g., 'Oven', 'Stovetop', 'Air Fryer'." },
        substitutions: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "An array of strings describing possible ingredient substitutions. For example, 'Chicken can be substituted with tofu'. Provide at least one."
        }
    },
    required: ["id", "name", "description", "ingredients", "prepSteps", "cookingTimeMinutes", "totalTimeMinutes", "energyLevel", "cleanupLevel", "isFavorite", "cuisine", "cookingMethod", "substitutions"],
};

const fullDayMealSchema = {
    type: Type.OBJECT,
    properties: {
        breakfast: recipeSchema,
        lunch: recipeSchema,
        snack: recipeSchema,
        dinner: recipeSchema,
    },
    required: ["breakfast", "lunch", "snack", "dinner"],
};

const receiptItemSchema = {
    type: Type.OBJECT,
    properties: {
        name: { type: Type.STRING, description: "The full name of the grocery item." },
        quantity: { type: Type.NUMBER, description: "The quantity purchased. Default to 1 if not specified." },
        unit: { type: Type.STRING, description: "The unit of measurement (e.g., 'lbs', 'oz', 'each'). Default to 'each' if not specified." },
        category: { type: Type.STRING, description: `The best pantry category for this item. Must be one of: ${PANTRY_CATEGORIES.join(', ')}` },
    },
    required: ["name", "quantity", "unit", "category"],
};


export const generateMealPlan = async (preferences: DietaryPreferences, pantry: Ingredient[], energyLevel: EnergyLevel, weeklyPreferences: string): Promise<Recipe[]> => {
    try {
        const availablePantryItems = pantry.filter(i => i.inStock);
        const prompt = `
            Create a 7-day dinner meal plan for a user with ADHD. The goal is to minimize decision fatigue and overwhelm.

            IMPORTANT: The user's current energy level is '${energyLevel}'. Please create a plan that reflects this.
            - For 'FULL_POWER', suggest more engaging or complex recipes that might take longer. At least 4 meals should be FULL_POWER.
            - For 'CRUISING', provide a standard mix of recipes with varying effort levels.
            - For 'LOW_BATTERY', prioritize quick and simple meals. At least 4 meals should be LOW_BATTERY or SOS.
            - For 'SOS', the plan should consist almost exclusively of meals that take less than 15 minutes and require minimal cleanup. At least 5 meals must be SOS.
            
            General rules:
            - Prioritize variety but keep ingredients simple and reusable across the week.
            - Break down all preparation into small, manageable 'prepSteps'.
            - The user has the following equipment: ${preferences.equipment.join(', ')}.

            Global Dietary Restrictions (NEVER include these):
            - ${preferences.globalRestrictions.join(', ') || 'None'}

            This Week's Preferences (Try to incorporate these):
            - ${weeklyPreferences || 'None'}
            
            Preferred Cuisines (focus on these styles of food):
            - ${preferences.cuisinePreferences.join(', ') || 'Any cuisine is fine'}

            Current Pantry Items (use these first before adding to a shopping list):
            ${availablePantryItems.map(i => `- ${i.name}`).join('\n') || 'Pantry is empty'}

            Generate 7 dinner recipes based on these rules. For each recipe, also specify its primary cuisine type (e.g., 'Italian', 'Mexican'), the primary cookingMethod used, and a list of potential ingredient substitutions. Return the response as a JSON array.
        `;
        
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: recipeSchema
                },
            },
        });
        
        const jsonText = response.text.trim();
        return JSON.parse(jsonText);
    } catch (error) {
        console.error("Error generating meal plan:", error);
        throw new Error("Failed to generate meal plan. The AI might be busy, please try again later.");
    }
};

export const generateDayMeals = async (
    preferences: DietaryPreferences,
    pantry: Ingredient[],
    energyLevel: EnergyLevel,
    weeklyPreferences: string,
): Promise<{ breakfast: Recipe; lunch: Recipe; snack: Recipe; dinner: Recipe; }> => {
    try {
        const availablePantryItems = pantry.filter(i => i.inStock);
        const prompt = `
            Create a full day of meals (Breakfast, Lunch, Snack, and Dinner) for a user with ADHD.
            The goal is to minimize decision fatigue and overwhelm.

            IMPORTANT: The user's current energy level is '${energyLevel}'. Please create recipes that reflect this.
            - For 'FULL_POWER', suggest more engaging or complex recipes.
            - For 'CRUISING', provide standard recipes.
            - For 'LOW_BATTERY', prioritize quick and simple meals.
            - For 'SOS', the recipes must take less than 15 minutes and require minimal cleanup.
            
            General rules:
            - Create one recipe for each meal type: Breakfast, Lunch, Snack, and Dinner.
            - Consider ingredient reusability across the day's meals if possible.
            - Break down all preparation into small, manageable 'prepSteps'.
            - The user has the following equipment: ${preferences.equipment.join(', ')}.

            Global Dietary Restrictions (NEVER include these):
            - ${preferences.globalRestrictions.join(', ') || 'None'}

            This Week's Preferences (Try to incorporate these):
            - ${weeklyPreferences || 'None'}
            
            Preferred Cuisines (focus on these styles of food):
            - ${preferences.cuisinePreferences.join(', ') || 'Any cuisine is fine'}

            Current Pantry Items (use these first):
            ${availablePantryItems.map(i => `- ${i.name}`).join('\n') || 'Pantry is empty'}

            Generate one recipe for each meal type. For each recipe, specify the primary 'cookingMethod' and at least one ingredient 'substitution'. 
            Return the response as a single JSON object with keys "breakfast", "lunch", "snack", and "dinner", where each key holds a complete recipe object.
        `;
        
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: fullDayMealSchema,
            },
        });
        
        const jsonText = response.text.trim();
        return JSON.parse(jsonText);
    } catch (error) {
        console.error(`Error generating day meals:`, error);
        throw new Error(`Failed to generate a full day's meals. The AI might be busy, please try again later.`);
    }
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
    try {
        const availablePantryItems = pantry.filter(i => i.inStock);
        
        const energyPrompt = isBatch
            ? `IMPORTANT: The user's energy level for the meal prep day is '${energyLevel}'. Generate recipes that are suitable for batch preparation, considering this energy level for the overall prep session complexity. The individual meals can be simple to assemble later.`
            : `IMPORTANT: The user's current energy level is '${energyLevel}'. Please create recipes that reflect this.
              - For 'FULL_POWER', suggest more engaging or complex recipes.
              - For 'CRUISING', provide standard recipes.
              - For 'LOW_BATTERY', prioritize quick and simple meals.
              - For 'SOS', the recipes must take less than 15 minutes and require minimal cleanup.`;

        const prompt = `
            Create ${count} unique ${mealType} recipe(s) for a user with ADHD.
            The goal is to minimize decision fatigue and overwhelm.

            ${energyPrompt}
            
            General rules:
            - Prioritize variety but keep ingredients simple.
            - Break down all preparation into small, manageable 'prepSteps'.
            - The user has the following equipment: ${preferences.equipment.join(', ')}.

            Global Dietary Restrictions (NEVER include these):
            - ${preferences.globalRestrictions.join(', ') || 'None'}

            This Week's Preferences (Try to incorporate these):
            - ${weeklyPreferences || 'None'}
            
            Preferred Cuisines (focus on these styles of food):
            - ${preferences.cuisinePreferences.join(', ') || 'Any cuisine is fine'}

            Current Pantry Items (use these first):
            ${availablePantryItems.map(i => `- ${i.name}`).join('\n') || 'Pantry is empty'}

            Generate ${count} ${mealType} recipes based on these rules. For each recipe, specify the primary 'cookingMethod' and at least one ingredient 'substitution'. Return the response as a JSON array of recipes.
        `;
        
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: recipeSchema
                },
            },
        });
        
        const jsonText = response.text.trim();
        return JSON.parse(jsonText);
    } catch (error) {
        console.error(`Error generating ${mealType} recipes:`, error);
        throw new Error(`Failed to generate ${mealType} recipes. The AI might be busy, please try again later.`);
    }
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
    try {
        const availablePantryItems = pantry.filter(i => i.inStock);
        
        let constraints = '';
        if (cookingMethod !== 'Any Method' && cookingMethod !== 'Any') {
            constraints += `\n- Must use the following cooking method: '${cookingMethod}'.`;
        }
        if (timeAvailable !== 'No Limit') {
            const timeInMinutes = { '15 minutes': 15, '30 minutes': 30, '1 hour': 60 }[timeAvailable] || 9999;
            constraints += `\n- The total cooking time must not exceed ${timeInMinutes} minutes.`;
        }

        const prompt = `
            Create ${count} unique ${mealType} recipe(s) for a user with ADHD.
            The goal is to minimize decision fatigue and overwhelm.

            IMPORTANT: The user's current energy level is '${energyLevel}'. Please create recipes that reflect this.
            - For 'FULL_POWER', suggest more engaging or complex recipes.
            - For 'CRUISING', provide standard recipes.
            - For 'LOW_BATTERY', prioritize quick and simple meals.
            - For 'SOS', the recipes must take less than 15 minutes and require minimal cleanup.
            
            **Recipe Constraints:** ${constraints || 'None'}

            General rules:
            - Prioritize variety but keep ingredients simple.
            - Break down all preparation into small, manageable 'prepSteps'.
            - The user has the following equipment: ${preferences.equipment.join(', ')}.

            Global Dietary Restrictions (NEVER include these):
            - ${preferences.globalRestrictions.join(', ') || 'None'}

            This Week's Preferences (Try to incorporate these):
            - ${weeklyPreferences || 'None'}
            
            Preferred Cuisines (focus on these styles of food):
            - ${preferences.cuisinePreferences.join(', ') || 'Any cuisine is fine'}

            Current Pantry Items (use these first):
            ${availablePantryItems.map(i => `- ${i.name}`).join('\n') || 'Pantry is empty'}

            Generate ${count} ${mealType} recipes based on these rules. For each recipe, specify the primary 'cookingMethod' used (which must adhere to the constraints) and a list of potential ingredient 'substitutions'. Return the response as a JSON array of recipes.
        `;
        
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: recipeSchema
                },
            },
        });
        
        const jsonText = response.text.trim();
        return JSON.parse(jsonText);
    } catch (error) {
        console.error(`Error generating targeted ${mealType} recipes:`, error);
        throw new Error(`Failed to generate targeted ${mealType} recipes. The AI might be busy, please try again later.`);
    }
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
    try {
        const availablePantryItems = pantry.filter(i => i.inStock);
        const prompt = `
            Generate a single recipe for a user with ADHD.

            **Constraints & Context:**
            - User's Energy Level: '${energyLevel}'. Adapt the recipe's complexity accordingly.
            - Meal Type: '${mealType}'.
            - Available Cooking Method: '${cookingMethod}'. If 'Any', you can choose the most suitable one from the user's available equipment.
            - Time Available: '${timeAvailable}'. The recipe's totalTimeMinutes should not exceed this, unless it's 'No Limit'.
            - User Instructions: ${customInstructions || 'None'}.
            - Available Equipment: ${preferences.equipment.join(', ')}.
            - Dietary Restrictions: Do NOT include ${preferences.globalRestrictions.join(', ')}.
            - Preferred Cuisines: ${preferences.cuisinePreferences.join(', ')}.
            - Pantry Items: Prioritize using these ingredients: ${availablePantryItems.map(i => i.name).join('\n')}.

            The goal is a simple, easy-to-follow recipe. Break down preparation into small, manageable 'prepSteps'.
            For the recipe, specify the primary 'cookingMethod' used and a list of potential ingredient 'substitutions'.
            Return the response as a single JSON object.
        `;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: recipeSchema,
            },
        });

        const jsonText = response.text.trim();
        // The API might still return an array with one item, so we handle both cases.
        const result = JSON.parse(jsonText);
        return Array.isArray(result) ? result[0] : result;
    } catch (error) {
        console.error("Error generating single meal:", error);
        throw new Error("Failed to generate a meal. The AI might be busy, please try again.");
    }
};

export const analyzeFridgeImage = async (base64Image: string, mimeType: string, preferences: DietaryPreferences): Promise<string> => {
    try {
        const imagePart = {
            inlineData: { data: base64Image, mimeType },
        };
        const textPart = {
            text: `
                I have ADHD and no energy to cook. Based on the ingredients in this image, suggest 3 extremely simple, low-effort meal ideas I can make right now.
                My dietary restrictions are: ${preferences.globalRestrictions.join(', ') || 'None'}.
                Format the response as simple, encouraging text.
            `,
        };

        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [imagePart, textPart] },
        });

        return response.text;
    } catch (error) {
        console.error("Error analyzing fridge image:", error);
        throw new Error("Failed to analyze image. Please try again.");
    }
};

export const scanReceipt = async (base64Image: string, mimeType: string): Promise<Omit<ScannedItem, 'isChecked'>[]> => {
    try {
        const imagePart = {
            inlineData: { data: base64Image, mimeType },
        };
        const textPart = {
            text: `
                Analyze this image of a grocery receipt. Identify all the food and drink items suitable for a home pantry.
                Ignore non-food items, taxes, totals, and store information.
                For each item, determine its name, quantity, unit of measurement (like 'lbs', 'oz', or 'each'), and assign it to the most logical pantry category.
                
                The valid pantry categories are: ${PANTRY_CATEGORIES.join(', ')}.
                
                Return the result as a JSON array of objects.
            `,
        };

        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [imagePart, textPart] },
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: receiptItemSchema,
                },
            }
        });

        const jsonText = response.text.trim();
        return JSON.parse(jsonText);
    } catch (error) {
        console.error("Error scanning receipt:", error);
        throw new Error("Failed to read the receipt. The image might be blurry or the format is not recognized. Please try again.");
    }
};