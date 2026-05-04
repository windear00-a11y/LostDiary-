import { getGenAI } from "@/lib/genai";
import { generateContentWithFallback } from "@/lib/genai-utils";
import { isHighValueResponse } from "@/lib/utils/quality";
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
}

export interface PipelineOutput {
  extractedEvent: any | null;
  shouldRespond: boolean;
  aiResponse: any | null;
  isHighValue: boolean;
  personaUpdate: string | null;
}

export class PipelineController {
  private currentPersona: string = "";
  private apiKey: string = "";

  constructor(apiKey: string, persona?: string) {
    this.apiKey = apiKey;
    this.currentPersona = persona || "";
  }

  private get ai() {
    return getGenAI();
  }

  async runPipeline(input: PipelineInput, decisions: OrchestrationDecisions): Promise<PipelineOutput> {
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
    let filteredEvent = extractedEvent && extractedEvent.eventType !== 'discard' ? extractedEvent : null;
    
    // Step 7: Persona Update (Identity extraction)
    let personaUpdate = null;
    // Bypassed: Intel profile extraction is now handled directly by intelligence-engine in route.ts
    // to prevent calling LLM twice for same data.

    // Step 8: Generate AI response (Bypassed in favor of primary ai-engine.ts)
    console.log("[Pipeline] Step 7: Generate AI response (Delegated to ai-engine)");
    let aiResponse = null;
    let isHighValue = false;
    
    // We already set decisions.shouldRespond = true in orchestrator
    // The actual text generation is now handled in the main route using generateStoryResponse
    // to ensure modern SDK patterns and resilient error handling.
    
    return {
      extractedEvent: filteredEvent,
      shouldRespond: decisions.shouldRespond,
      aiResponse: null,
      isHighValue: false,
      personaUpdate
    };
  }

  // --- Logic moved from event-engine.ts & life-author.ts ---
  public async extractMultipleLifeEvents(messages: { id: string, content: string }[]): Promise<any[]> {
    if (!messages || messages.length === 0) return [];

    const systemInstruction = `
You are a behavioral intelligence system and an AI Pattern Detector.
Goal: Convert an array of chat messages/diary entries into an array of structured insights tracking emotions, triggers, and patterns.

Output format:
{
  "events": [
    {
      "message_id": "the original string id",
      "summary": "1-line objective description of the event",
      "raw_fragment": "The exact core phrasing used by the user",
      "emotion": "Specific emotion word (e.g. sad, anxious, neutral)",
      "trigger": "The root cause, person, or event. Null if unknown.",
      "tags": ["array", "of", "pattern", "tags"],
      "category": "Love | Work | Family | Health | Social | Growth",
      "metrics": {
        "emotion_intensity": 0-5,
        "personal_relevance": 0-5
      }
    }
  ]
}
Rules:
- Output ONLY a valid JSON object with the "events" array.
- Process EACH message provided. If a message is truly insignificant, you may omit it or score it 0.
- Capture EXACT phrases in "raw_fragment".
`;

    try {
      const payload = JSON.stringify(messages.map(m => ({ id: m.id, content: m.content })));
      const response = await generateContentWithFallback({
        model: "gemini-3-flash-preview",
        contents: [{ role: "user", parts: [{ text: payload }] }],
        config: { systemInstruction, temperature: 0.1, responseMimeType: "application/json" }
      });
      const text = response.text?.trim();
      if (!text) return [];
      
      const parsed = JSON.parse(text);
      const events = parsed.events || [];

      return events.map((event: any) => {
        
        if (event.metrics) {
          const scored = calculateEventScore(event.metrics);
          event.score = scored.score;
          event.eventType = scored.eventType;
        } else {
          event.score = 5;
          event.eventType = 'minor';
        }
        return event;
      });

    } catch (error) {
      console.error("Error extracting multiple life events:", error);
      return [];
    }
  }

  public async extractLifeEvent(content: string): Promise<any | null> {
    const systemInstruction = `
You are a behavioral intelligence system and an AI Pattern Detector.
Goal: Convert chat messages/diary entries into structured insights tracking emotions, triggers, and patterns.

Rules for "raw_fragment":
- Capture the EXACT core phrase or emotional anchor word the user used. 
- Do not paraphrase. If they said "I'm tired", the fragment is "I'm tired".

Output:
{
  "summary": "1-line objective description of the event",
  "raw_fragment": "The exact core phrasing used by the user",
  "emotion": "Specific emotion word (e.g. sad, anxious, confident, frustrated, joyful, neutral)",
  "trigger": "The root cause, person, or event triggering this emotion (e.g. 'project deadline', 'argument with friend'). Null if unknown.",
  "tags": ["array", "of", "pattern", "tags", "e.g. 'self-doubt', 'burnout', 'clarity'"],
  "category": "Love | Work | Family | Health | Social | Growth",
  "metrics": {
    "emotion_intensity": 0-5,
    "personal_relevance": 0-5
  }
}
Rules:
- Output ONLY a valid JSON object.
- Be objective. No drama. Identify the root trigger and any recurring behavior tags if visible.
`;
    try {
      const response = await generateContentWithFallback({
        model: "gemini-3-flash-preview",
        contents: [{ role: "user", parts: [{ text: content }] }],
        config: { systemInstruction, temperature: 0.1, responseMimeType: "application/json" }
      });
      const text = response.text?.trim();
      if (!text) return null;
      const parsed = JSON.parse(text);
      
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

  public async generateSessionTitle(messages: string[]): Promise<string | null> {
    if (!messages || messages.length === 0) return null;
    const systemInstruction = `
You are a minimalist editor. Your goal is to generate a short, meaningful emotional timestamp title (max 5 words) for a chat session.
Rules:
1. Format: Use emotional timestamps (e.g., "Midnight, a quiet doubt", "A Tuesday, shadowed", "Morning, with cold tea").
2. Stoic: Do not use dramatic words.
3. Language: If the conversation is in Hindi, use simple Hinglish/Hindi emotional anchors.
`;
    const content = messages.join('\n');
    try {
      const response = await generateContentWithFallback({
        model: "gemini-3-flash-preview",
        contents: [{ role: "user", parts: [{ text: content }] }],
        config: { systemInstruction, temperature: 0.7 }
      });
      return response.text?.trim() || null;
    } catch (error) {
      console.error("Error generating session title:", error);
      return null;
    }
  }
}
