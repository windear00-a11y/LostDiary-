import { GoogleGenAI, Type } from "@google/genai";
import { AIPersonality } from "./personality";
import { DiaryMemory } from "@/lib/memory-system";

export interface AIResponse {
  emotion_reflection: string;
  validation: string;
  insight: string;
  gentle_suggestion: string;
  short_reply: string;
}

export class ResponseEngine {
  private ai: GoogleGenAI;

  constructor(apiKey: string) {
    this.ai = new GoogleGenAI({ apiKey });
  }

  async generateStructuredResponse(input: string, memory?: DiaryMemory): Promise<AIResponse> {
    let contextPrompt = "";
    if (memory && memory.recent_entries.length > 0) {
      contextPrompt = `
[MEMORY CONTEXT]
Dominant Emotion: ${memory.dominant_emotion}
Recurring Patterns: ${memory.recurring_patterns.join(", ")}
Recent Entries: ${memory.recent_entries.join(" | ")}

[INSTRUCTIONS]
1. Continuity: Show you remember the user's journey. If they've been feeling ${memory.dominant_emotion} lately, acknowledge it subtly without being repetitive.
2. Subtle References: If the current message relates to past patterns (${memory.recurring_patterns.join(", ")}), mention it naturally (e.g., "I noticed you've been thinking about [topic] again").
3. Avoid Repetition: Do not repeat the same advice or suggestions from previous entries.
4. Human-like: Avoid robotic phrases like "Based on your memory...". Instead, use natural transitions like "It seems like..." or "I've noticed...".
`;
    }

    const fullInput = contextPrompt ? `${contextPrompt}\n\n[USER MESSAGE]\n${input}` : input;
    
    const response = await this.ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ role: "user", parts: [{ text: fullInput }] }],
      config: {
        systemInstruction: AIPersonality.systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            emotion_reflection: { type: Type.STRING, description: "Reflect the user's feeling back to them. Use varied and natural phrasing." },
            validation: { type: Type.STRING, description: "Make the user feel understood and heard. Avoid generic scripts." },
            insight: { type: Type.STRING, description: "A meaningful observation or connection. Connect to their journey if possible." },
            gentle_suggestion: { type: Type.STRING, description: "Soft guidance, not forceful advice. Keep it conversational." },
            short_reply: { type: Type.STRING, description: "A casual, human-like closing. Vary this every time." }
          },
          required: ["emotion_reflection", "validation", "insight", "gentle_suggestion", "short_reply"]
        }
      }
    });

    return JSON.parse(response.text || "{}");
  }
}
