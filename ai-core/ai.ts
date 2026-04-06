import { logger } from "@/lib/logger";
import { IntentType, Persona, AIInsightResponse, WeeklyReflectionResponse, SpellingCheckResponse } from "./types";

let brainInstance: any = null;

async function getBrain() {
  if (!brainInstance) {
    const { initializeBrain } = await import("./brain");
    brainInstance = initializeBrain(process.env.NEXT_PUBLIC_GEMINI_API_KEY || "");
  }
  return brainInstance;
}

export async function detectLanguage(text: string) {
  try {
    const brain = await getBrain();
    return await brain.detectLanguage(text);
  } catch (error) {
    logger.error('Language detection error:', error);
    return 'en';
  }
}

export async function normalizeContent(text: string, lang: string) {
  try {
    const brain = await getBrain();
    return await brain.normalizeContent(text, lang);
  } catch (error) {
    logger.error('Normalization error:', error);
    return text;
  }
}

export async function translateText(text: string, targetLangCode: string) {
  try {
    const brain = await getBrain();
    return await brain.translateText(text, targetLangCode);
  } catch (error) {
    logger.error('Translation error:', error);
    return text;
  }
}

export async function generateAIInsight(normalizedContent: string, inputLang: string) {
  try {
    const brain = await getBrain();
    const result = await brain.reflectOnEntry(normalizedContent);
    return {
      mood: result.sentiment,
      insight: result.insight,
      suggestion: "Take a moment for yourself.", // Default suggestion
      summary: result.summary
    };
  } catch (error) {
    logger.error('Insight generation error:', error);
    return null;
  }
}

export async function processDiaryEntry(text: string, settings: { understand_language: string, response_language: string }) {
  try {
    const brain = await getBrain();
    return await brain.processDiaryEntry(text);
  } catch (error) {
    logger.error('Process diary entry error:', error);
    return null;
  }
}

export async function generateWeeklyReflection(entries: any[]) {
  try {
    const brain = await getBrain();
    return await brain.generateWeeklyReflection(entries);
  } catch (error) {
    logger.error('Weekly Reflection Error:', error);
    throw error;
  }
}

export async function checkSpelling(text: string) {
  try {
    const brain = await getBrain();
    return await brain.checkSpelling(text);
  } catch (error) {
    logger.error('Spelling check error:', error);
    return null;
  }
}

export async function classifyIntent(text: string): Promise<IntentType> {
  try {
    const brain = await getBrain();
    return await brain.classifyIntent(text);
  } catch (error) {
    logger.error('Intent classification error:', error);
    return 'chat';
  }
}

export async function handleChat(query: string, entries: any[], responseLang: string, intent: IntentType = 'recall', persona: Persona) {
  try {
    const brain = await getBrain();
    return await brain.handleChat(query, entries);
  } catch (error: any) {
    logger.error('Chat error:', error);
    return "I'm having a little trouble connecting to your memories right now. Could you try asking that again in a moment?";
  }
}

export async function generateDailyPrompt(entries: any[]) {
  try {
    const brain = await getBrain();
    return await brain.generateDailyPrompt();
  } catch (error) {
    logger.error('Prompt generation error:', error);
    return "What's on your mind today?";
  }
}

export async function generateInlineSuggestions(text: string, type: 'improve' | 'continue' | 'rephrase') {
  try {
    const brain = await getBrain();
    return await brain.generateInlineSuggestions(text);
  } catch (error) {
    logger.error('Inline suggestion error:', error);
    return null;
  }
}
