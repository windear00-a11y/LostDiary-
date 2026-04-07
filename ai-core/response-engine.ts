import { GoogleGenAI, Type } from "@google/genai";
import { AIPersonality } from "./personality";

export interface AIResponse {
  emotion: string;
  insight: string;
  suggestion: string;
  short_reply: string;
}

export class ResponseEngine {
  private ai: GoogleGenAI;

  constructor(apiKey: string) {
    this.ai = new GoogleGenAI({ apiKey });
  }

  async generateStructuredResponse(input: string): Promise<AIResponse> {
    const response = await this.ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ role: "user", parts: [{ text: input }] }],
      config: {
        systemInstruction: AIPersonality.systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            emotion: { type: Type.STRING },
            insight: { type: Type.STRING },
            suggestion: { type: Type.STRING },
            short_reply: { type: Type.STRING }
          },
          required: ["emotion", "insight", "suggestion", "short_reply"]
        }
      }
    });

    return JSON.parse(response.text || "{}");
  }
}
