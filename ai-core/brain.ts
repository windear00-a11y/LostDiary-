import { AIResponse } from "./response-engine";
import { memorySystem } from "@/lib/memory-system";
import { analyzeEntries } from "./pattern-detector";

export const generateAIResponse = async (input: string): Promise<AIResponse> => {
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";
  const memory = memorySystem.getMemory();

  // 1. Run live pattern analysis on recent entries
  const patternReport = analyzeEntries(memory.recent_entries);

  // 2. Call backend for tracking and context coordination
  try {
    await fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        input, 
        memory_snapshot: { ...memory, ...patternReport } 
      })
    });
  } catch (err) {
    console.warn('[AI TRACKING FAILED]', err);
  }
  
  const { ResponseEngine } = await import("./response-engine");
  const engine = new ResponseEngine(apiKey);
  return engine.generateStructuredResponse(input, memory, patternReport);
};
