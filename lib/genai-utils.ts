import { getGenAI } from "./genai";

const FALLBACK_MODELS = [
  "gemini-3.1-flash-lite-preview",
  "gemini-3.1-pro-preview",
];

export async function generateContentWithFallback(params: any): Promise<any> {
  const ai = getGenAI();
  let lastError;

  // Try the provided model first (if any), then standard fallbacks
  const modelsToTry = [...new Set([params.model, ...FALLBACK_MODELS])].filter(Boolean);

  for (const model of modelsToTry) {
    try {
      if (process.env.NODE_ENV !== 'production') {
        console.log(`Attempting generation with model: ${model}`);
      }
      const response = await ai.models.generateContent({
        ...params,
        model
      });
      return response;
    } catch (error: any) {
      console.warn(`Model ${model} failed:`, error.message);
      lastError = error;
      
      // Check if it's a structural error (like invalid schema) in which case switching models probably won't help,
      // but if it's quota (429) or overloaded (503) or not found (404), we should definitely try the next.
      // Easiest is to always fallback.
    }
  }

  throw lastError || new Error("All fallback models failed.");
}
