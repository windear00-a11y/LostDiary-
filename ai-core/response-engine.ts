/**
 * response-engine.ts
 * Handles the interaction with the Gemini API.
 */

import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { AIPersonality } from "./personality";

export interface AIResponse {
  summary: string;
  insight: string;
  sentiment: string;
  tags: string[];
}

export interface StructuredAIResponse {
  emotion: string;
  insight: string;
  suggestion: string;
  short_reply: string;
}

export class ResponseEngine {
  private ai: GoogleGenAI;
  private modelName: string;

  constructor(apiKey: string, modelName: string = "gemini-3-flash-preview") {
    if (!apiKey) {
      throw new Error("Gemini API Key is required for ResponseEngine.");
    }
    this.ai = new GoogleGenAI({ apiKey });
    this.modelName = modelName;
  }

  /**
   * Generates a conversational response based on user input.
   */
  async generateResponse(userInput: string, history: any[] = []): Promise<string> {
    try {
      const response = await this.ai.models.generateContent({
        model: this.modelName,
        contents: [
          ...history,
          { role: "user", parts: [{ text: userInput }] }
        ],
        config: {
          systemInstruction: AIPersonality.systemInstruction,
          temperature: 0.7,
        },
      });

      return response.text || "I'm here to listen, but I couldn't process that right now.";
    } catch (error) {
      console.error("AI Response Generation Error:", error);
      throw error;
    }
  }

  /**
   * Analyzes an entry to extract structured insights (JSON).
   */
  async analyzeEntry(content: string): Promise<AIResponse> {
    try {
      const response = await this.ai.models.generateContent({
        model: this.modelName,
        contents: [{ role: "user", parts: [{ text: `Analyze this diary entry: "${content}"` }] }],
        config: {
          systemInstruction: `${AIPersonality.systemInstruction}\n\nAnalyze the diary entry and provide a summary, insight, sentiment, and relevant tags in JSON format.`,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: { type: Type.STRING, description: "A brief summary of the entry." },
              insight: { type: Type.STRING, description: "A deeper reflection or insight." },
              sentiment: { type: Type.STRING, description: "The primary emotion detected (e.g., Happy, Sad, Anxious)." },
              tags: { 
                type: Type.ARRAY, 
                items: { type: Type.STRING },
                description: "Relevant category tags (e.g., Work, Family, Health)."
              }
            },
            required: ["summary", "insight", "sentiment", "tags"]
          }
        }
      });

      const result = JSON.parse(response.text || "{}");
      return result as AIResponse;
    } catch (error) {
      console.error("AI Analysis Error:", error);
      return { summary: "Analysis unavailable.", insight: "No insights found.", sentiment: "Neutral", tags: [] };
    }
  }

  /**
   * Generates a structured AI output based on user input and personality config.
   */
  async generateStructuredResponse(userInput: string): Promise<StructuredAIResponse> {
    try {
      const response = await this.ai.models.generateContent({
        model: this.modelName,
        contents: [{ role: "user", parts: [{ text: userInput }] }],
        config: {
          systemInstruction: `${AIPersonality.systemInstruction}\n\nReturn the response in a structured JSON format.`,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              emotion: { type: Type.STRING, description: "The primary emotion detected in the user's input." },
              insight: { type: Type.STRING, description: "A thoughtful reflection or observation about the user's input." },
              suggestion: { type: Type.STRING, description: "A small, actionable suggestion for the user." },
              short_reply: { type: Type.STRING, description: "A brief, empathetic conversational reply." }
            },
            required: ["emotion", "insight", "suggestion", "short_reply"]
          }
        }
      });

      const result = JSON.parse(response.text || "{}");
      return result as StructuredAIResponse;
    } catch (error) {
      console.error("Structured AI Response Error:", error);
      return {
        emotion: "Neutral",
        insight: "I'm here to listen and support you.",
        suggestion: "Take a deep breath and reflect on your day.",
        short_reply: "I'm listening. Tell me more."
      };
    }
  }

  /**
   * Generic method to generate structured output for any task.
   */
  async generateGenericStructuredResponse<T>(prompt: string, schema: any, systemInstruction?: string): Promise<T> {
    try {
      const response = await this.ai.models.generateContent({
        model: this.modelName,
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: {
          systemInstruction: systemInstruction || AIPersonality.systemInstruction,
          responseMimeType: "application/json",
          responseSchema: schema
        }
      });

      return JSON.parse(response.text || "{}") as T;
    } catch (error) {
      console.error("Generic Structured Response Error:", error);
      throw error;
    }
  }
}
