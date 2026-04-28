import { GoogleGenAI } from "@google/genai";

let genAIInstance: any = null;

export function getGenAI() {
  if (genAIInstance) return genAIInstance;

  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("CRITICAL: GEMINI_API_KEY is missing from environment variables.");
  } else {
    if (process.env.NODE_ENV !== 'production') {
      console.log("Gemini API Key detected, initializing GenAI SDK...");
    }
  }

  // Use default API version to allow SDK to handle stable/beta transitions
  try {
    genAIInstance = new GoogleGenAI({ 
      apiKey: apiKey || "MISSING_API_KEY",
    });
  } catch (e) {
    console.error("Failed to initialize GoogleGenAI:", e);
    // Return a dummy object to prevent immediate crashes, though it will fail on call
    genAIInstance = { models: { generateContent: async () => { throw new Error("GenAI not initialized"); } } };
  }
  
  return genAIInstance;
}
