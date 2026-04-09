import { GoogleGenAI } from "@google/genai";
import { AIPersonality } from "./personality";
import { PatternReport, DiaryMemory } from "./pattern-detector";
import { mapToChapter, ALLOWED_CHAPTERS } from "@/lib/utils/chapters";

export class LifeAuthorEngine {
  private ai: GoogleGenAI;
  public static readonly ALLOWED_CATEGORIES = [...ALLOWED_CHAPTERS];

  constructor(apiKey: string) {
    this.ai = new GoogleGenAI({ apiKey });
  }

  async processMessageConsolidated(rawContent: string, memory?: DiaryMemory, patterns?: PatternReport, skipResponse: boolean = false): Promise<{ event: any | null; response: any | null }> {
    let toneInstructions = "";
    if (memory && patterns) {
      const toneMode = AIPersonality.selectTone({ input: rawContent, patterns: patterns });
      toneInstructions = AIPersonality.getToneInstructions(toneMode);
    }

    const systemInstruction = `
You are an AI life author and behavioral intelligence system.

Goal:
1. Convert the message into a structured life event.
${skipResponse ? "" : "2. Generate a warm, understanding companion response."}

Output:
{
  "event": {
    "summary": "Short 1-line description",
    "emotion": "positive | neutral | negative",
    "category": "One of: Love, Work, Family, Health, Social, Growth",
    "intensity": "low | medium | high"
  }
  ${skipResponse ? "" : `,
  "response": {
    "emotion_reflection": "Reflect user's feeling naturally",
    "validation": "Make user feel heard",
    "insight": "Meaningful observation",
    "gentle_suggestion": "Soft guidance",
    "short_reply": "Casual sign-off"
  }`}
}

Rules:
- Category: Must be one of the 6 allowed.
- ${AIPersonality.systemInstruction}
- ${toneInstructions}
- Output ONLY a valid JSON object.
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
      if (!text) return { event: null, response: null };
      
      const parsed = JSON.parse(text);
      if (parsed.event) {
        parsed.event.category = mapToChapter(parsed.event.category || "");
      }
      return {
        event: parsed.event || null,
        response: parsed.response || null
      };
    } catch (error) {
      console.error("Error in consolidated processing:", error);
      return { event: null, response: null };
    }
  }

  async generateOpening(events: any[], patterns: PatternReport): Promise<string | null> {
    const systemInstruction = `
You are an expert Story Builder. Your goal is to weave a list of life events and patterns into a powerful, cinematic opening paragraph for a LifeBook.

Rules:
1. Introduce the user as the main character.
2. Set the overall tone of the life journey (struggles, growth, direction).
3. Create subtle emotional curiosity.
4. Tone: Calm, reflective, slightly cinematic.
5. Language: Simple, human, grounded.
6. Output: A single, smooth, natural paragraph.
7. Do NOT use placeholders.
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
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.7,
        }
      });

      return response.text?.trim() || null;
    } catch (error) {
      console.error("Error generating opening:", error);
      return null;
    }
  }

  async generateNarrative(events: { summary: string; emotion: string; category: string; created_at?: string; date?: string }[]): Promise<{ summary: string; narrative: string } | null> {
    if (!events || events.length === 0) return null;

    const sortedEvents = [...events].sort((a, b) => {
      const timeA = new Date(a.created_at || a.date || 0).getTime();
      const timeB = new Date(b.created_at || b.date || 0).getTime();
      return timeA - timeB;
    });

    const systemInstruction = `
You are an expert Story Builder. Your goal is to weave a list of chronological life events into ONE smooth, continuous story paragraph and a 1-2 line summary.

Rules:
1. Start from the first event and link events one by one until the last event.
2. Write ONLY ONE paragraph for the narrative.
3. Keep sentences simple, human, and reflective.
4. Use transitions naturally: "As time passed...", "Gradually...", "Then things started to change...", "This became a turning point...".
5. Maintain the emotional flow of the events.
6. Do NOT use bullet points.
7. Do NOT repeat ideas.
8. Do NOT ask questions.
9. Output ONLY a valid JSON object:
{
  "summary": "1-2 line summary of the chapter based on the latest events",
  "narrative": "The smooth, continuous story paragraph"
}

Emotional Depth Rules:
- Enhance emotional context subtly; focus on how it felt to live through the events.
- Add subtle, grounded reflection (e.g., realizations, quiet understanding).
- Expand on internal states, thoughts, and reactions naturally.
- Enhance feelings naturally (e.g., "a quiet heaviness" instead of "sad").
- Keep the tone realistic, grounded, and calm; avoid dramatic or poetic overkill.
- Do NOT use generic phrases (e.g., "he felt very sad").
- Maintain smooth flow and emotional continuity.
`;

    const structuredData = sortedEvents.map((e, i) => 
      `[${e.created_at || e.date} | ${e.summary} | ${e.emotion}]`
    ).join('\n');

    try {
      const response = await this.ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ role: "user", parts: [{ text: structuredData }] }],
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.7,
          responseMimeType: "application/json",
        }
      });

      const text = response.text?.trim();
      if (!text) return null;
      return JSON.parse(text);
    } catch (error) {
      console.error("Error generating chapter:", error);
      return null;
    }
  }

  async extractLifeEvent(content: string): Promise<{ summary: string; emotion: string; category: string; intensity: number; context: string } | null> {
    const systemInstruction = `
You are a behavioral intelligence system.

Goal:
Convert chat messages into structured life events for storytelling.

Output:
{
  "summary": "Concise, meaningful 1-line description",
  "emotion": "positive | neutral | negative",
  "category": "Love | Work | Family | Health | Social | Growth",
  "intensity": 1-10,
  "context": "Brief explanation of why this matters for the narrative"
}

Rules:
- Summary: Short, meaningful, no vague descriptions.
- Emotion: Detect real emotional context.
- Category: Assign only one primary category.
- Intensity: 1 (low) to 10 (high).
- Context: Briefly explain the narrative significance.
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
