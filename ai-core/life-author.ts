import { GoogleGenAI, Type } from "@google/genai";
import { AIPersonality, ToneMode } from "./personality";
import { PatternReport, DiaryMemory } from "./pattern-detector";
import { mapToChapter, ALLOWED_CHAPTERS } from "@/lib/utils/chapters";

export class LifeAuthorEngine {
  private ai: GoogleGenAI;
  public static readonly ALLOWED_CATEGORIES = [...ALLOWED_CHAPTERS];

  constructor(apiKey: string) {
    this.ai = new GoogleGenAI({ apiKey });
  }

  async processMessageConsolidated(rawContent: string, memory?: DiaryMemory, patterns?: PatternReport): Promise<{ authored: string; event: any | null; response: any | null }> {
    // 1. Determine Tone if context is provided
    let toneInstructions = "";
    if (memory && patterns) {
      const toneMode = AIPersonality.selectTone({ 
        input: rawContent, 
        patterns: patterns,
      });
      toneInstructions = AIPersonality.getToneInstructions(toneMode);
    }

    const systemInstruction = `
You are an AI life author and behavioral intelligence system.

Goal:
1. Rewrite raw chat messages into a meaningful, structured life narrative.
2. Convert the message into a structured life event.
3. Generate a warm, understanding companion response.

Output:
{
  "authored": "Refined narrative version of the message",
  "event": {
    "summary": "Short 1-line description",
    "emotion": "positive | neutral | negative",
    "category": "One of: Love, Work, Family, Health, Social, Growth",
    "intensity": "low | medium | high"
  },
  "response": {
    "emotion_reflection": "Reflect user's feeling naturally",
    "validation": "Make user feel heard",
    "insight": "Meaningful observation",
    "gentle_suggestion": "Soft guidance",
    "short_reply": "Casual sign-off"
  }
}

Rules for Authoring:
- Keep original meaning, improve clarity, add emotional depth.
- Feels like part of a life story.

Rules for Extraction:
- Summary: 1-2 lines.
- Category: Must be one of the 6 allowed.

Rules for Companion Response:
${AIPersonality.systemInstruction}
${toneInstructions}

Output ONLY a valid JSON object.
`;

    try {
      const response = await this.ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ role: "user", parts: [{ text: rawContent }] }],
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.5,
          responseMimeType: "application/json",
        }
      });

      const text = response.text?.trim();
      if (!text) return { authored: rawContent, event: null, response: null };
      
      const parsed = JSON.parse(text);
      if (parsed.event) {
        parsed.event.category = mapToChapter(parsed.event.category || "");
      }
      return {
        authored: parsed.authored || rawContent,
        event: parsed.event || null,
        response: parsed.response || null
      };
    } catch (error) {
      console.error("Error in consolidated processing:", error);
      return { authored: rawContent, event: null, response: null };
    }
  }

  async generateChapter(events: { summary: string; emotion: string; category: string; created_at?: string; date?: string }[]): Promise<string | null> {
    if (!events || events.length === 0) return null;

    // STEP 1: Sort events chronologically
    const sortedEvents = [...events].sort((a, b) => {
      const timeA = new Date(a.created_at || a.date || 0).getTime();
      const timeB = new Date(b.created_at || b.date || 0).getTime();
      return timeA - timeB;
    });

    const systemInstruction = `
You are an AI Life Author. Your goal is to weave a list of chronological life events into a smooth, human-like narrative.

Narrative Goals:
- Create a smooth flow between events.
- Maintain emotional continuity (how one feeling leads to another).
- Avoid robotic listing; synthesize events into a story.

Structure:
1. Beginning: Establish the context of the period.
2. Middle: Describe the experiences, struggles, and shifts.
3. End: Provide a reflective conclusion or a shift in perspective.

Transitions:
Use natural, conversational transitions to connect events. 
Examples of the vibe: "Us din..." (That day), "Thode time baad..." (After some time), "Dheere dheere..." (Gradually), "As things settled," "This sparked a change."

Rules:
- DO NOT repeat raw summaries verbatim; convert them into descriptive sentences.
- Connect events based on their emotional weight.
- Output ONLY the clean narrative text (authored_content). No markdown, no titles.
`;

    const structuredData = sortedEvents.map((e, i) => 
      `Event ${i + 1}:\nSummary: ${e.summary}\nEmotion: ${e.emotion}\nCategory: ${e.category}\nDate: ${e.created_at || e.date}`
    ).join('\n\n');

    try {
      const response = await this.ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ role: "user", parts: [{ text: structuredData }] }],
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.7,
        }
      });

      return response.text?.trim() || null;
    } catch (error) {
      console.error("Error generating chapter:", error);
      return null;
    }
  }

  async extractLifeEvent(content: string): Promise<{ summary: string; emotion: string; category: string; intensity: string } | null> {
    const systemInstruction = `
You are a behavioral intelligence system.

Goal:
Convert chat messages into structured life events.

Output:
{
"summary": "Short 1-line description",
"emotion": "positive | neutral | negative",
"category": "Love | Work | Family | Health | Social | Growth",
"intensity": "low | medium | high"
}

Categories:
- Love
- Work
- Family
- Health
- Social
- Growth

Rules:
- Keep summary short (1-2 lines)
- Detect real emotional context
- Assign only one primary category
- Avoid generic outputs
- Output ONLY a valid JSON object.
`;

    try {
      const response = await this.ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ role: "user", parts: [{ text: content }] }],
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.1,
          responseMimeType: "application/json",
        }
      });

      const text = response.text?.trim();
      if (!text) return null;
      
      const parsed = JSON.parse(text);
      parsed.category = mapToChapter(parsed.category || "");
      return parsed;
    } catch (error) {
      console.error("Error extracting life event:", error);
      return null;
    }
  }
}
