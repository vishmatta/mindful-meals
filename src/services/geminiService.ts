import { GoogleGenAI, Type, GenerateContentResponse, Modality } from "@google/genai";
import { DietaryPreferences, Ingredient, Recipe, EnergyLevel, ScannedItem, ShoppingListItem } from '../types';
import { PANTRY_CATEGORIES } from "../constants";

// Fix: Use process.env.API_KEY as per the coding guidelines.
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
        },
        sourceType: { type: Type.STRING, description: "Set to 'youtube' if the recipe is derived from a provided YouTube source, otherwise set to 'ai'. Default is 'ai'." },
        sourceUrl: { type: Type.STRING, description: "If sourceType is 'youtube', this is the original video URL." },
        sourceTitle: { type: Type.STRING, description: "If sourceType is 'youtube', this is the original video title." },
        sourceChannel: { type: Type.STRING, description: "If sourceType is 'youtube', this is the name of the YouTube channel." },
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

const shoppingListItemSchema = {
    type: Type.OBJECT,
    properties: {
        name: { type: Type.STRING, description: "The consolidated, title-cased name of the item, e.g., 'Tomatoes', 'Chicken Breast'." },
        quantity: { type: Type.NUMBER, description: "The total numerical quantity. Should be a whole number." },
        unit: { type: Type.STRING, description: "The unit for the quantity, e.g., 'medium', 'lbs', 'cups'. Consolidate if possible (e.g. '3 medium'), otherwise describe mixed units like '1 cup + 200g'." },
        store: { type: Type.STRING, description: "The most appropriate store from the provided list to buy this item from." },
        isOptional: { type: Type.BOOLEAN, description: "Set to true if the ingredient was marked as optional in any of the recipes. Default to false." }
    },
    required: ["name", "quantity", "unit", "store", "isOptional"],
};

const generateYoutubePromptSection = (preferences: DietaryPreferences): string => {
    if (!preferences.youtubeSources || preferences.youtubeSources.length === 0) {
        return "The user has not provided any YouTube videos for inspiration. All recipes should be generated by you. Set 'sourceType' to 'ai' for all recipes.";
    }

    const videos = preferences.youtubeSources;

    // Start with the base rule for when to engage with YouTube sources.
    let prompt = `
        **YouTube Source Instructions:**
        The user has saved the following YouTube videos. You should only use one of these videos if the user's custom prompt explicitly asks for it by its user-provided name (e.g., "use my 'Garlic Noodles' video"). If the user's prompt does not mention one of these videos, you MUST generate all recipes from scratch and set their 'sourceType' to 'ai'.

        **Saved Videos:**
        ${videos.map(source => `- Name: "${source.name}", URL: ${source.url}`).join('\n')}
        
        **Rule for Sourcing from a Video:**
        If the user asks for a recipe from one of the videos above, you MUST base your generated recipe on that video's likely content. When you do this:
        1. Set 'sourceType' to 'youtube'.
        2. Set 'sourceUrl' to the exact video URL from the list above.
        3. Set 'sourceTitle' to the exact user-provided Name from the list above.
        4. Do NOT invent a 'sourceChannel'. Leave it blank.

        **Final Check:**
        - A recipe can ONLY have sourceType='youtube' if it is based on a specific video from the list above, requested by the user.
        - Any recipe generated without an explicit user request to use a saved video MUST have sourceType='ai'.
    `;

    return prompt;
};


export const generateMealPlan = async (preferences: DietaryPreferences, pantry: Ingredient[], energyLevel: EnergyLevel, weeklyPreferences: string): Promise<Recipe[]> => {
    try {
        const availablePantryItems = pantry.filter(i => i.inStock);
        const youtubePrompt = generateYoutubePromptSection(preferences);
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
            
            ${youtubePrompt}

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
        const youtubePrompt = generateYoutubePromptSection(preferences);
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
            
            ${youtubePrompt}

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
        const youtubePrompt = generateYoutubePromptSection(preferences);
        
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
            
            ${youtubePrompt}

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
        const youtubePrompt = generateYoutubePromptSection(preferences);
        
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
            
            ${youtubePrompt}

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
        const youtubePrompt = generateYoutubePromptSection(preferences);
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
            
            ${youtubePrompt}

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

export const generateShoppingList = async (
    recipes: Recipe[],
    pantryItems: Ingredient[],
    storeOptions: string[]
): Promise<Omit<ShoppingListItem, 'id' | 'isGenerated' | 'isChecked'>[]> => {
    try {
        const requiredIngredients = recipes.flatMap(r => r.ingredients.map(i => ({...i, recipeName: r.name})));
        const inStockPantry = pantryItems.filter(i => i.inStock);

        const prompt = `
            You are a smart shopping list assistant for a user with ADHD. Your goal is to create a simple, consolidated, and intelligent shopping list.

            **Task:**
            Analyze the list of required ingredients from the user's weekly recipes and compare it against their current in-stock pantry items. Generate a shopping list of items they need to buy.

            **Rules:**
            1.  **Pantry Awareness:** Do NOT add an item to the shopping list if it's already in the pantry. You must perform fuzzy matching. For example, if the pantry has "Cilantro", you should consider "chopped fresh cilantro" as covered and not add it to the list. If the pantry has "Onion", it covers "1 red onion" or "diced yellow onion". Be smart about this.
            2.  **Consolidation & Aggregation:** Combine identical or very similar items into a single line item. For example, if one recipe needs "1 tomato" and another needs "2 tomatoes", the list should have one entry for "Tomatoes" with a quantity of 3.
            3.  **Quantity Summation:** Sum the quantities for consolidated items.
                - If units are compatible (e.g., 'grams' and 'kg'), convert to a single sensible unit.
                - If units are just counts (e.g., '1 tomato', '2 tomatoes'), sum them.
                - If units are incompatible (e.g., '1 cup flour' and '200g flour'), you can represent it in the 'unit' field like "1 cup + 200g" with a quantity of 1.
            4.  **Exclusions:** Do NOT add common staples like "Water", "Salt", "Black Pepper" to the list unless a recipe calls for an unusually large quantity.
            5.  **Store Assignment:** For each item, assign it to the most logical store from this list: ${storeOptions.join(', ')}. If unsure, default to the first store in the list.
            6.  **Optional Items:** If an ingredient is marked as 'isOptional: true' in any recipe, the final consolidated item on the shopping list should also be marked as 'isOptional: true'.

            **Input Data:**

            **In-Stock Pantry Items:**
            ${inStockPantry.map(i => `- ${i.name}`).join('\n') || 'Pantry is empty'}

            **Required Ingredients from Recipes:**
            ${JSON.stringify(requiredIngredients, null, 2)}

            **Output:**
            Return a JSON array of shopping list items based on the rules above.
        `;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: shoppingListItemSchema
                },
            },
        });

        const jsonText = response.text.trim();
        return JSON.parse(jsonText);
    } catch (error) {
        console.error("Error generating shopping list:", error);
        throw new Error("Failed to generate shopping list. The AI might be busy, please try again later.");
    }
};