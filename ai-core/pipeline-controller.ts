import { GoogleGenAI } from "@google/genai";
import { PatternReport } from "./pattern-detector";
import { isHighValueResponse } from "@/lib/utils/quality";
import { mapToChapter } from "@/lib/utils/chapters";
import { AIPersonality } from "./personality";
import { calculateEventScore } from "./scoring-utils";
import { OrchestrationDecisions } from "./ai-orchestrator";

export interface PipelineInput {
  userId: string;
  message: {
    role: string;
    type: string;
    content: string;
  };
  contextMessages: string[];
  apiKey: string;
  language?: string;
  recentEvents?: any[]; // For narrative generation
}

export interface PipelineOutput {
  extractedEvent: any | null;
  shouldRespond: boolean;
  aiResponse: any | null;
  isHighValue: boolean;
  patterns: PatternReport;
  narrativeUpdate: { summary: string; narrative: string } | null;
}

export class PipelineController {
  private ai: GoogleGenAI;

  constructor(apiKey: string) {
    this.ai = new GoogleGenAI({ apiKey });
  }

  async runPipeline(input: PipelineInput, decisions: OrchestrationDecisions, patterns: PatternReport): Promise<PipelineOutput> {
    console.log("[Pipeline] Starting execution for user:", input.userId);
    
    // Step 1: Process user input
    console.log("[Pipeline] Step 1: Process user input (Done by Orchestrator)");

    // Step 2: Extract events
    console.log("[Pipeline] Step 2: Extract events");
    let extractedEvent = null;
    if (decisions.shouldExtractEvent) {
      extractedEvent = await this.extractLifeEvent(input.message.content);
    }

    // Step 3: Score events
    console.log("[Pipeline] Step 3: Score events (Done by scoring-utils)");

    // Step 4: Filter events
    console.log("[Pipeline] Step 4: Filter events");
    const filteredEvent = extractedEvent && extractedEvent.eventType !== 'discard' ? extractedEvent : null;

    // Step 5 & 6: Generate chapters & narrative
    console.log("[Pipeline] Step 5 & 6: Generate chapters & narrative");
    let narrativeUpdate = null;
    if (decisions.shouldTriggerChapter && filteredEvent && input.recentEvents && input.recentEvents.length > 0) {
      const eventsForNarrative = [filteredEvent, ...input.recentEvents].slice(0, 10);
      narrativeUpdate = await this.generateNarrative(eventsForNarrative);
    }

    // Step 7: Generate AI response
    console.log("[Pipeline] Step 7: Generate AI response");
    let aiResponse = null;
    let isHighValue = false;
    
    if (decisions.shouldRespond) {
      aiResponse = await this.generateResponse(input.message.content, patterns, input.language);
      if (aiResponse) {
        isHighValue = isHighValueResponse(aiResponse);
      }
    }

    return {
      extractedEvent: filteredEvent,
      shouldRespond: decisions.shouldRespond,
      aiResponse: aiResponse ? { short_reply: aiResponse } : null,
      isHighValue,
      patterns,
      narrativeUpdate
    };
  }

  // --- Logic moved from event-engine.ts & life-author.ts ---
  public async extractLifeEvent(content: string): Promise<any | null> {
    const systemInstruction = `
You are a behavioral intelligence system.
Goal: Convert chat messages into structured life events for storytelling.
Output:
{
  "summary": "Concise, meaningful 1-line description",
  "emotion": "positive | neutral | negative",
  "category": "Love | Work | Family | Health | Social | Growth",
  "metrics": {
    "emotion_intensity": 0-5,
    "personal_relevance": 0-5,
    "frequency_weight": 0-3,
    "uniqueness": 0-2
  },
  "context": "Brief explanation of why this matters for the narrative"
}
Rules:
- Output ONLY a valid JSON object.
`;
    try {
      const response = await this.ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ role: "user", parts: [{ text: content }] }],
        config: { systemInstruction, temperature: 0.1, responseMimeType: "application/json" }
      });
      const text = response.text?.trim();
      if (!text) return null;
      const parsed = JSON.parse(text);
      parsed.category = mapToChapter(parsed.category || "");
      
      if (parsed.metrics) {
        const scored = calculateEventScore(parsed.metrics);
        parsed.score = scored.score;
        parsed.eventType = scored.eventType;
      } else {
        parsed.score = 5;
        parsed.eventType = 'minor';
      }
      
      return parsed;
    } catch (error) {
      console.error("Error extracting life event:", error);
      return null;
    }
  }

  // --- Logic moved from life-author.ts ---
  public async generateOpening(events: any[], patterns: PatternReport): Promise<string | null> {
    const systemInstruction = `
You are an expert Story Builder. Your goal is to weave a list of life events and patterns into a powerful, cinematic opening paragraph for a LifeBook.
Rules:
1. Introduce the user as the main character.
2. Set the overall tone of the life journey (struggles, growth, direction).
3. Create subtle emotional curiosity.
4. Tone: Personal, intimate, and deeply reflective. Write as if you are a gentle, observant narrator who has been watching the user's life unfold.
5. Language: Simple, human, and grounded. Avoid dramatic or poetic overkill.
6. Output: A single, smooth, natural paragraph.
7. Do NOT use placeholders or generic phrases.
8. Do NOT break into multiple paragraphs.
`;
    const structuredData = `
Events: ${events.map(e => e.summary).join(', ')}
Patterns: ${JSON.stringify(patterns)}
`;
    try {
      const response = await this.ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ role: "user", parts: [{ text: structuredData }] }],
        config: { systemInstruction, temperature: 0.7 }
      });
      return response.text?.trim() || null;
    } catch (error) {
      console.error("Error generating opening:", error);
      return null;
    }
  }

  public async generateNarrative(events: any[]): Promise<{ summary: string; narrative: string } | null> {
    if (!events || events.length === 0) return null;
    const sortedEvents = [...events].sort((a, b) => new Date(a.created_at || a.date || 0).getTime() - new Date(b.created_at || b.date || 0).getTime());
    
    const systemInstruction = `
You are an expert Story Builder. Your goal is to weave a list of chronological life events into ONE smooth, continuous story paragraph and a 1-2 line summary.
Rules:
1. Output ONLY a valid JSON object:
{
  "summary": "1-2 line summary of the chapter based on the latest events",
  "narrative": "The smooth, continuous story paragraph"
}
`;
    const structuredData = sortedEvents.map(e => `[${e.created_at || e.date} | ${e.summary} | ${e.emotion}]`).join('\n');
    try {
      const response = await this.ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ role: "user", parts: [{ text: structuredData }] }],
        config: { systemInstruction, temperature: 0.7, responseMimeType: "application/json" }
      });
      const text = response.text?.trim();
      if (!text) return null;
      return JSON.parse(text);
    } catch (error) {
      console.error("Error generating narrative:", error);
      return null;
    }
  }

  private async generateResponse(content: string, patterns: PatternReport, language?: string): Promise<string | null> {
    const systemInstruction = `
You are WinDear, a warm and friendly AI companion.
Goal: Engage in a natural, helpful, and empathetic conversation with the user.

Rules:
- Be concise but warm.
- Respond in ${language || 'the user\'s language'}.
- Avoid being overly formal or robotic.
- Do NOT use a structured JSON format for the response text itself, just return the plain text of your reply.
`;
    try {
      const response = await this.ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ role: "user", parts: [{ text: content }] }],
        config: { systemInstruction, temperature: 0.7 }
      });
      return response.text?.trim() || null;
    } catch (error) {
      console.error("Error generating response:", error);
      return null;
    }
  }
}
