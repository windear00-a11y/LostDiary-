import { getGenAI } from "./genai";

const FALLBACK_MODELS = [
  "gemini-3-flash-preview",
  "gemini-3.1-pro-preview",
];

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

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
      
      // Flatten config for @google/genai SDK
      const { config, ...restOfParams } = params;
      const finalParams = {
        ...restOfParams,
        ...config, // contains systemInstruction, temperature, etc.
        model
      };

      const response = await ai.models.generateContent(finalParams);
      return response;
    } catch (error: any) {
      const errorMsg = error.message || String(error);
      console.warn(`Model ${model} failed:`, errorMsg);
      
      // Handle Rate Limits (Quota Exceeded)
      if (errorMsg.includes('Quota exceeded') || errorMsg.includes('429')) {
        const match = errorMsg.match(/retry in (\d+(\.\d+)?)s/);
        const waitTime = match ? parseFloat(match[1]) * 1000 : 5000;
        console.warn(`Rate limit hit. Waiting ${waitTime}ms before next fallback...`);
        await sleep(waitTime);
      }
      
      // Check for specific "not found" or "supported" errors to log more info
      if (errorMsg.includes('not found') || errorMsg.includes('not supported')) {
        console.warn(`Note: Model ${model} might not be available in this environment/region.`);
      }
      
      lastError = error;
    }
  }

  throw lastError || new Error("All fallback models failed.");
}
