import { GoogleGenAI, Type } from "@google/genai";
import { AIPersonality, ToneMode } from "./personality";
import { DiaryMemory } from "@/lib/memory-system";
import { PatternReport } from "./pattern-detector";

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

  async generateStructuredResponse(input: string, memory?: DiaryMemory, patterns?: PatternReport): Promise<AIResponse> {
    // 1. Get last tone from storage to avoid repetition
    const lastTone = typeof window !== 'undefined' ? localStorage.getItem('windear_last_tone') as ToneMode : undefined;

    // 2. Determine Tone Mode
    const toneMode = AIPersonality.selectTone({ 
      input, 
      patterns: patterns || { emotional_trend: "stable", dominant_emotion: "neutral", recurring_topics: [], risk_flag: false },
      lastTone: lastTone || undefined
    });
    const toneInstructions = AIPersonality.getToneInstructions(toneMode);

    // 3. Persist current tone for next time
    if (typeof window !== 'undefined') {
      localStorage.setItem('windear_last_tone', toneMode);
    }

    let contextPrompt = "";
    if (memory && memory.recent_entries.length > 0) {
      const dominantEmotion = patterns?.dominant_emotion || memory.dominant_emotion;
      const trend = patterns?.emotional_trend || memory.emotional_trend;
      const risk = patterns?.risk_flag || memory.risk_flag;
      const topics = patterns?.recurring_topics || memory.recurring_patterns;

      contextPrompt = `
[MEMORY CONTEXT]
Dominant Emotion: ${dominantEmotion}
Emotional Trend: ${trend}
Risk Flag: ${risk ? "HIGH (User is showing signs of persistent distress or decline)" : "Normal"}
Recurring Patterns: ${topics.join(", ")}
Recent Entries: ${memory.recent_entries.join(" | ")}

[TONE SELECTION]
${toneInstructions}

[INSTRUCTIONS]
1. Continuity: Show you remember the user's journey. If they've been feeling ${dominantEmotion} lately, acknowledge it subtly.
2. Trend Awareness: If the trend is ${trend}, adjust your tone. If "improving", be encouraging. If "declining", be extra supportive and gentle.
3. Risk Handling: If Risk Flag is HIGH, be extremely empathetic, validating, and prioritize safety and soft support. Do not be overly cheerful.
4. Subtle Pattern Mention: Mention emotional trends naturally. For example, if they've been low for a few days, say something like "I've noticed you've been feeling a bit low lately..." but keep it warm and human.
5. Recurring Emotions: If the current message relates to past patterns (${topics.join(", ")}), mention it naturally.
6. Avoid Repetition: Do not repeat the same advice or suggestions from previous entries.
7. Human-like: Avoid robotic phrases like "Based on your memory...". Instead, use natural transitions like "It seems like..." or "I've noticed...".
`;
    }

    const fullInput = contextPrompt ? `${contextPrompt}\n\n[USER MESSAGE]\n${input}` : input;
    
    // Add a randomization hint to the system instruction to force variety
    const variationHint = `\n[VARIATION HINT: ${Math.random().toString(36).substring(7)} - Use a unique phrasing style for this specific interaction. Avoid your previous common patterns.]`;

    const response = await this.ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ role: "user", parts: [{ text: fullInput }] }],
      config: {
        systemInstruction: AIPersonality.systemInstruction + variationHint,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            emotion_reflection: { type: Type.STRING, description: "Reflect the user's feeling back to them. Use varied, natural, and unique phrasing. Never start with 'I understand'." },
            validation: { type: Type.STRING, description: "Make the user feel understood. Connect to the specific nuance of their situation." },
            insight: { type: Type.STRING, description: "A meaningful observation. Connect to their journey or patterns if possible." },
            gentle_suggestion: { type: Type.STRING, description: "Soft guidance. Keep it conversational and low-pressure." },
            short_reply: { type: Type.STRING, description: "A casual, human-like closing. Use a unique sign-off every time." }
          },
          required: ["emotion_reflection", "validation", "insight", "gentle_suggestion", "short_reply"]
        }
      }
    });

    return JSON.parse(response.text || "{}");
  }
}
