import { ResponseEngine, AIResponse } from "./response-engine";

export const generateAIResponse = async (input: string): Promise<AIResponse> => {
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";
  const engine = new ResponseEngine(apiKey);
  return engine.generateStructuredResponse(input);
};
