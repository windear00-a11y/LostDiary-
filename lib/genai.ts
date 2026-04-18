import { GoogleGenAI } from "@google/genai";

let genAIInstance: any = null;

export function getGenAI() {
  if (genAIInstance) return genAIInstance;

  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) {
    // In production build, we might not have the key, so we shouldn't crash
    if (process.env.NODE_ENV === 'production' && typeof window === 'undefined') {
      console.warn("NEXT_PUBLIC_GEMINI_API_KEY is missing during build.");
    }
  }

  // Use a placeholder if missing to prevent the constructor from throwing immediately
  // while still allowing the build to continue.
  genAIInstance = new GoogleGenAI({ apiKey: apiKey || "MISSING_API_KEY" });
  return genAIInstance;
}
