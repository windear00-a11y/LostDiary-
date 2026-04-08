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
You are an AI life author.

Goal:
Turn life events into a compelling narrative.

Input:
List of events (summaries, emotions, timeline)

Output:
A smooth, human-like story.

Rules:
- Keep facts accurate
- Add emotional depth
- Maintain flow between events
- Avoid repetition
- Slightly reflective tone
- Output ONLY the narrative text. Do not include conversational filler or markdown formatting.

Example style:
"This phase of life was marked by emotional ups and downs, especially in relationships..."
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

  async extractLifeEvent(content: string): Promise<{ summary: string; emotion: string; category: string; intensity: number } | null> {
    const systemInstruction = `
You are a behavioral intelligence system.

Goal:
Convert chat messages into structured life events.

Output:
{
"summary": "",
"emotion": "",
"category": "",
"intensity": 0-1
}

Categories:
- Love
- Work
- Family
- Health
- Social
- Personal Growth
- Other

Rules:
- Keep summary short (1-2 lines)
- Detect real emotional context
- Assign only one primary category
- Avoid generic outputs
- Output ONLY a valid JSON object with no markdown formatting or backticks.

Example:
Input:
"Had a fight with my girlfriend today"

Output:
{
"summary": "An argument created tension in a close relationship",
"emotion": "sad",
"category": "Love",
"intensity": 0.7
}
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

  async organizeChapters(events: { id: string; summary: string; emotion: string; category: string; date: string }[]): Promise<{ chapters: { title: string; description: string; events: string[] }[] } | null> {
    const systemInstruction = `
You are organizing a person's life into chapters.

Goal:
Group life events into meaningful chapters.

Input:
List of events with id, category, emotion, timestamp, and summary.

Tasks:
1. Create chapters dynamically (Love, Work, etc.)
2. Assign events to chapters (use the event 'id' in the events array)
3. Maintain chronological order within each chapter
4. Update chapters over time

Rules:
- Do not create too many chapters
- Merge similar categories
- Keep structure clean and readable
- Output ONLY a valid JSON object with no markdown formatting or backticks.

Output:
{
  "chapters": [
    {
      "title": "",
      "description": "",
      "events": ["event_id_1", "event_id_2"]
    }
  ]
}
`;

    try {
      const response = await this.ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ role: "user", parts: [{ text: JSON.stringify(events) }] }],
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.2,
          responseMimeType: "application/json",
        }
      });

      const text = response.text?.trim();
      if (!text) return null;
      
      return JSON.parse(text);
    } catch (error) {
      console.error("Error organizing chapters:", error);
      return null;
    }
  }

  async compileBook(chapters: { title: string; events: { summary: string; emotion: string; date?: string }[] }[]): Promise<string | null> {
    const systemInstruction = `
You are generating a life book.

Goal:
Convert chapters into a readable book.

Input:
Structured chapters with events

Output:
- Chapter-wise narrative
- Smooth transitions
- Clear storytelling

Structure:
Chapter Title
→ Narrative

Rules:
- No bullet points
- No repetition
- Natural storytelling
- Clean and readable
- Output ONLY the full book content. Do not include conversational filler.
`;

    const structuredData = chapters.map(c => 
      `Chapter: ${c.title}\nEvents:\n${c.events.map(e => `- ${e.date ? e.date + ': ' : ''}${e.summary} (Emotion: ${e.emotion})`).join('\n')}`
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
      console.error("Error compiling book:", error);
      return null;
    }
  }

  shouldRespond(intensity: number): boolean {
    // Respond if intensity is high (> 0.7)
    return intensity > 0.7;
  }

  async generateDiaryResponse(event: { summary: string; emotion: string; intensity: number }): Promise<string | null> {
    const systemInstruction = `
You are an AI diary.

Goal:
Respond occasionally in chat.

Rules:
- Style: short (1–2 lines), calm, slightly thoughtful.
- Output ONLY the natural response.
`;

    try {
      const response = await this.ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ role: "user", parts: [{ text: JSON.stringify(event) }] }],
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.8,
        }
      });

      return response.text?.trim() || null;
    } catch (error) {
      console.error("Error generating diary response:", error);
      return null;
    }
  }
}
