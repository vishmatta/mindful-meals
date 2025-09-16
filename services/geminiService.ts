import { GoogleGenAI, Type, GenerateContentResponse, Modality } from "@google/genai";
import { DietaryPreferences, Ingredient, Recipe } from '../types';

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
                },
                required: ["name", "quantity", "unit"],
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
    },
    required: ["id", "name", "description", "ingredients", "prepSteps", "cookingTimeMinutes", "totalTimeMinutes", "energyLevel", "cleanupLevel", "isFavorite", "cuisine"],
};


export const generateMealPlan = async (preferences: DietaryPreferences, pantry: Ingredient[]): Promise<Recipe[]> => {
    try {
        const availablePantryItems = pantry.filter(i => i.inStock);
        const prompt = `
            Create a 7-day dinner meal plan for a user with ADHD. The goal is to minimize decision fatigue and overwhelm.
            - Prioritize variety but keep ingredients simple and reusable across the week.
            - Ensure a mix of energy levels required for cooking. Include at least two 'LOW_BATTERY' or 'SOS' meals.
            - Break down all preparation into small, manageable 'prepSteps'.
            - The user has the following equipment: ${preferences.equipment.join(', ')}.

            Global Dietary Restrictions (NEVER include these):
            - ${preferences.globalRestrictions.join(', ') || 'None'}

            This Week's Preferences (Try to incorporate these):
            - ${preferences.weeklyCustomizations.join(', ') || 'None'}
            
            Preferred Cuisines (focus on these styles of food):
            - ${preferences.cuisinePreferences.join(', ') || 'Any cuisine is fine'}

            Current Pantry Items (use these first before adding to a shopping list):
            ${availablePantryItems.map(i => `- ${i.name}`).join('\n') || 'Pantry is empty'}

            Generate 7 dinner recipes based on these rules. For each recipe, also specify its primary cuisine type (e.g., 'Italian', 'Mexican'). Return the response as a JSON array.
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