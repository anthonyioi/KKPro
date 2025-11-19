import { GoogleGenAI, Type, Schema } from "@google/genai";
import { Macros, Exercise } from "../types";

// Initialize Gemini
// NOTE: In a real app, ensure API_KEY is secured via backend or strict CORS/Env policies.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const modelId = "gemini-2.5-flash";

/**
 * Calculates macros for a given food description using Gemini.
 */
export const analyzeFood = async (foodDescription: string): Promise<{ name: string; macros: Macros }> => {
  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      name: { type: Type.STRING, description: "A short, clean name for the food item" },
      macros: {
        type: Type.OBJECT,
        properties: {
          calories: { type: Type.NUMBER },
          protein: { type: Type.NUMBER },
          carbs: { type: Type.NUMBER },
          fat: { type: Type.NUMBER },
          fiber: { type: Type.NUMBER },
          potassium: { type: Type.NUMBER },
          sodium: { type: Type.NUMBER },
        },
        required: ["calories", "protein", "carbs", "fat", "fiber", "potassium", "sodium"]
      }
    },
    required: ["name", "macros"]
  };

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: `Analyze the nutritional value of this food: "${foodDescription}". Estimate values if exact data is unavailable. Return JSON.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    // Fallback for demo purposes if API fails or key is missing
    return {
      name: foodDescription,
      macros: { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, potassium: 0, sodium: 0 }
    };
  }
};

/**
 * Generates a workout plan based on user request and type.
 */
export const generateWorkout = async (prompt: string, type: 'strength' | 'cardio'): Promise<{ name: string; exercises: Exercise[] }> => {
  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      name: { type: Type.STRING, description: "Name of the workout session" },
      exercises: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            name: { type: Type.STRING },
            sets: { type: Type.NUMBER, description: "For strength exercises" },
            reps: { type: Type.STRING, description: "For strength exercises" },
            weight: { type: Type.NUMBER, description: "Estimated weight in kg" },
            duration: { type: Type.NUMBER, description: "For cardio: Duration in minutes" },
            distance: { type: Type.NUMBER, description: "For cardio: Distance in km" },
            intensity: { type: Type.STRING, description: "For cardio: Speed, Incline, or Zone description" },
            notes: { type: Type.STRING }
          },
          required: ["name"]
        }
      }
    },
    required: ["name", "exercises"]
  };

  const strengthInstruction = "Focus on sets, reps, and weight.";
  const cardioInstruction = "Focus on duration (minutes), distance (km), and intensity (e.g., 'Pace 5:00', 'Zone 2', 'Incline 12').";

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: `Create a ${type} workout routine based on this request: "${prompt}". ${type === 'cardio' ? cardioInstruction : strengthInstruction} Return JSON.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    const data = JSON.parse(text);
    
    // Ensure IDs and types are set correctly
    data.exercises = data.exercises.map((e: any, i: number) => ({ 
      ...e, 
      id: `ai-${Date.now()}-${i}`,
      type: type 
    }));
    
    return data;
  } catch (error) {
    console.error("Gemini Workout Error:", error);
    return {
      name: `Custom ${type === 'strength' ? 'Workout' : 'Cardio'}`,
      exercises: []
    };
  }
};