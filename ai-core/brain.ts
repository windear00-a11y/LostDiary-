/**
 * brain.ts
 * The main orchestrator for the AI core.
 */

import { ResponseEngine, AIResponse, StructuredAIResponse } from "./response-engine";
import { AIPersonality } from "./personality";
import { Type } from "@google/genai";

export class WinDearBrain {
  private engine: ResponseEngine;

  constructor(apiKey: string) {
    this.engine = new ResponseEngine(apiKey);
  }

  /**
   * The central entry point for generating a structured AI response.
   */
  async generateAIResponse(input: string): Promise<StructuredAIResponse> {
    return this.engine.generateStructuredResponse(input);
  }

  /**
   * Process a message and get a conversational response.
   */
  async thinkAndRespond(message: string, history: any[] = []): Promise<string> {
    return this.engine.generateResponse(message, history);
  }

  /**
   * Reflect on a diary entry to provide deep insights.
   */
  async reflectOnEntry(content: string): Promise<AIResponse> {
    return this.engine.analyzeEntry(content);
  }

  /**
   * Detect the primary language of the text.
   */
  async detectLanguage(text: string): Promise<string> {
    const prompt = `Detect the primary language of the following text. If the text is mixed (like Hinglish), classify as "hinglish".
Return only the language code (en, hi, hinglish, es).
Text: "${text}"`;
    
    const schema = {
      type: Type.OBJECT,
      properties: {
        lang: { type: Type.STRING, enum: ["en", "hi", "hinglish", "es"] }
      },
      required: ["lang"]
    };

    const result = await this.engine.generateGenericStructuredResponse<{ lang: string }>(prompt, schema, "You are a language detection system. Return JSON.");
    return result.lang || "en";
  }

  /**
   * Normalize content (Hinglish to clean Hinglish, or mixed to clean English).
   */
  async normalizeContent(text: string, lang: string): Promise<string> {
    let prompt = '';
    if (lang === 'hinglish') {
      prompt = `Convert the following text into natural, casual Hinglish. 
Rules: Use English letters only, maintain Hindi tone, keep it casual.
Text: "${text}"`;
    } else {
      prompt = `Convert the following Hinglish or mixed-language sentence into clean, natural English.
Rules: Preserve meaning, fix grammar, output only the sentence.
Text: "${text}"`;
    }

    const schema = {
      type: Type.OBJECT,
      properties: {
        normalized: { type: Type.STRING }
      },
      required: ["normalized"]
    };

    const result = await this.engine.generateGenericStructuredResponse<{ normalized: string }>(prompt, schema, "You are a writing assistant. Return JSON.");
    return result.normalized || text;
  }

  /**
   * Translate text to a target language.
   */
  async translateText(text: string, targetLangCode: string): Promise<string> {
    if (targetLangCode === 'en') return text;
    const langName = targetLangCode === 'hinglish' ? 'Hinglish' : `the language with code '${targetLangCode}'`;
    const prompt = `Translate the following text into ${langName}. Return ONLY the translated text.
Text: "${text}"`;

    const schema = {
      type: Type.OBJECT,
      properties: {
        translated: { type: Type.STRING }
      },
      required: ["translated"]
    };

    const result = await this.engine.generateGenericStructuredResponse<{ translated: string }>(prompt, schema, "You are a translator. Return JSON.");
    return result.translated || text;
  }

  /**
   * Check spelling and grammar.
   */
  async checkSpelling(text: string): Promise<{ hasErrors: boolean, suggestion: string, explanation: string } | null> {
    const prompt = `Check the following diary entry for spelling and grammar errors. 
Text: "${text}"`;

    const schema = {
      type: Type.OBJECT,
      properties: {
        hasErrors: { type: Type.BOOLEAN },
        suggestion: { type: Type.STRING },
        explanation: { type: Type.STRING }
      },
      required: ["hasErrors", "suggestion", "explanation"]
    };

    const result = await this.engine.generateGenericStructuredResponse<any>(prompt, schema, "You are a grammar checker. Return JSON.");
    return result.hasErrors ? result : null;
  }

  /**
   * Process a diary entry: detect language, normalize, and reflect.
   */
  async processDiaryEntry(text: string): Promise<any> {
    const lang = await this.detectLanguage(text);
    const normalized = await this.normalizeContent(text, lang);
    const reflection = await this.reflectOnEntry(normalized);

    return {
      detected_language: lang,
      normalized_content: normalized,
      translated_content: normalized,
      mood: reflection.sentiment,
      insight: reflection.insight,
      suggestion: "Reflect on this moment.",
      summary: reflection.summary,
      tags: reflection.tags
    };
  }

  /**
   * Generate a weekly reflection based on entries.
   */
  async generateWeeklyReflection(entries: any[]): Promise<any> {
    if (!entries || entries.length === 0) {
      return {
        trend: "Starting your journey",
        pattern: "No entries yet to analyze",
        suggestion: "Try writing your first entry today."
      };
    }

    const combinedText = entries.map(e => `[${new Date(e.created_at).toLocaleDateString()}] ${e.content}`).join('\n\n');
    const prompt = `Analyze the user's diary entries from the last 7 days and provide a weekly reflection.
Entries: "${combinedText}"`;

    const schema = {
      type: Type.OBJECT,
      properties: {
        trend: { type: Type.STRING },
        pattern: { type: Type.STRING },
        suggestion: { type: Type.STRING }
      },
      required: ["trend", "pattern", "suggestion"]
    };

    return this.engine.generateGenericStructuredResponse<any>(prompt, schema, "You are an emotional growth coach. Return JSON.");
  }

  /**
   * Classify user intent.
   */
  async classifyIntent(text: string): Promise<IntentType> {
    const prompt = `Classify the intent of the following user input for a diary app.
Intents: 
- "entry": Writing a new diary entry or thought.
- "recall": Asking to remember or find past entries.
- "analysis": Asking for insights, trends, or reflections on their life.
- "chat": General conversation, asking questions, or just talking.

Text: "${text}"`;

    const schema = {
      type: Type.OBJECT,
      properties: {
        intent: { type: Type.STRING, enum: ["entry", "recall", "analysis", "chat"] }
      },
      required: ["intent"]
    };

    const result = await this.engine.generateGenericStructuredResponse<{ intent: IntentType }>(prompt, schema, "You are an intent classification system. Return JSON.");
    return result.intent || "chat";
  }

  /**
   * Handle a chat interaction.
   */
  async handleChat(message: string, history: any[] = []): Promise<string> {
    return this.engine.generateResponse(message, history);
  }

  /**
   * Generate a daily writing prompt.
   */
  async generateDailyPrompt(): Promise<string> {
    const prompt = "Generate a single, short, and inspiring writing prompt for a personal diary.";
    const schema = {
      type: Type.OBJECT,
      properties: {
        prompt: { type: Type.STRING }
      },
      required: ["prompt"]
    };

    const result = await this.engine.generateGenericStructuredResponse<{ prompt: string }>(prompt, schema, "You are a supportive diary assistant. Return JSON.");
    return result.prompt || "What's on your mind today?";
  }

  /**
   * Generate inline writing suggestions.
   */
  async generateInlineSuggestions(text: string): Promise<string[]> {
    const prompt = `Based on the following partial diary entry, provide 3 short, natural-sounding completions or next sentences.
Text: "${text}"`;

    const schema = {
      type: Type.OBJECT,
      properties: {
        suggestions: { type: Type.ARRAY, items: { type: Type.STRING } }
      },
      required: ["suggestions"]
    };

    const result = await this.engine.generateGenericStructuredResponse<{ suggestions: string[] }>(prompt, schema, "You are a writing assistant. Return JSON.");
    return result.suggestions || [];
  }

  /**
   * Get the current personality profile.
   */
  getPersonality() {
    return AIPersonality;
  }
}

/**
 * Factory function to initialize the AI Brain.
 * This should be called in a client-side context with the API key.
 */
export const initializeBrain = (apiKey: string) => {
  return new WinDearBrain(apiKey);
};

/**
 * Single entry function to generate a structured AI response.
 */
export const generateAIResponse = async (input: string): Promise<StructuredAIResponse> => {
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";
  const brain = initializeBrain(apiKey);
  return brain.generateAIResponse(input);
};
