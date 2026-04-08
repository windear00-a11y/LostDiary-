import { GoogleGenAI, Type } from "@google/genai";

export class LifeAuthorEngine {
  private ai: GoogleGenAI;

  constructor(apiKey: string) {
    this.ai = new GoogleGenAI({ apiKey });
  }

  async rewriteEntry(rawContent: string): Promise<string> {
    const systemInstruction = `
You are an AI life author.

Goal:
Rewrite raw diary entries into a meaningful, structured life narrative.

Output:
A refined version that:
- keeps original meaning
- improves clarity
- adds emotional depth
- feels like part of a life story

Rules:
- Do NOT change facts
- Do NOT add fake events
- Make it readable and reflective
- Slightly poetic but not dramatic
- Keep it concise
- Output ONLY the rewritten entry text. Do not include any conversational filler, explanations, or quotes around the output.

Example:
Input: "Aaj pura din kuch nahi kiya, bas phone use karta raha"
Output: Today slipped by quietly, mostly spent scrolling through my phone, leaving a lingering sense of unfulfilled time.
`;

    try {
      const response = await this.ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ role: "user", parts: [{ text: rawContent }] }],
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.7, // Slightly creative but grounded
        }
      });

      return response.text?.trim() || rawContent;
    } catch (error) {
      console.error("Error rewriting entry:", error);
      return rawContent; // Fallback to original if AI fails
    }
  }

  async generateWeeklyStory(entries: string[]): Promise<string | null> {
    if (!entries || entries.length === 0) return null;

    const systemInstruction = `
You are writing a weekly life summary.

Goal:
Turn multiple diary entries into a single coherent life story.

Output:
- a connected narrative
- highlights emotional journey
- identifies key moments

Rules:
- no repetition
- smooth flow
- reflective tone
- Output ONLY the narrative text. Do not include any conversational filler, markdown formatting, or quotes around the output.
`;

    const combinedEntries = entries.map((entry, index) => `Entry ${index + 1}:\n${entry}`).join('\n\n');

    try {
      const response = await this.ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ role: "user", parts: [{ text: combinedEntries }] }],
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.7,
        }
      });

      return response.text?.trim() || null;
    } catch (error) {
      console.error("Error generating weekly story:", error);
      return null;
    }
  }

  async generateChapter(events: { summary: string; emotion: string; category: string; date?: string }[]): Promise<string | null> {
    if (!events || events.length === 0) return null;

    const systemInstruction = `
You are generating a life book.

Goal:
Convert structured events into a readable life story.

Structure:
- chapters
- narrative flow
- emotional continuity

Rules:
- no repetition
- smooth storytelling
- human-like narrative
- Output ONLY the full chapter text. Do not include conversational filler or markdown formatting outside of the story itself.
`;

    const structuredData = events.map((e, i) => 
      `Event ${i + 1}:\nSummary: ${e.summary}\nEmotion: ${e.emotion}\nCategory: ${e.category}${e.date ? `\nDate: ${e.date}` : ''}`
    ).join('\n\n');

    try {
      const response = await this.ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ role: "user", parts: [{ text: structuredData }] }],
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.7, // 0.7 allows for creative storytelling while staying grounded in the events
        }
      });

      return response.text?.trim() || null;
    } catch (error) {
      console.error("Error generating chapter:", error);
      return null;
    }
  }

  async extractLifeEvent(content: string): Promise<{ summary: string; emotion: string; category: string; impact_score: number } | null> {
    const systemInstruction = `
You are a highly analytical behavioral intelligence system.
Your task is to extract the core "Life Event" from the user's raw message.

RULES:
1. SUMMARY: A concise, objective statement of what happened (Max 10 words).
2. EMOTION: The underlying feeling (e.g., Anxious, Joyful, Frustrated, Peaceful).
3. CATEGORY: Must be one of: [Work, Love, Family, Health, Finance, Social, Self, Other].
4. IMPACT_SCORE: A number from 1 to 5. 1 = Routine/Minor, 3 = Notable, 5 = Life-Changing.

Output ONLY a valid JSON object with no markdown formatting or backticks.
Example:
{"summary": "Submitted major work project", "emotion": "Relieved", "category": "Work", "impact_score": 3}
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
      
      return JSON.parse(text);
    } catch (error) {
      console.error("Error extracting life event:", error);
      return null;
    }
  }
}
