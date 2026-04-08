import { GoogleGenAI, Type } from "@google/genai";

export class LifeAuthorEngine {
  private ai: GoogleGenAI;
  public static readonly ALLOWED_CATEGORIES = ["Love", "Work", "Family", "Health", "Growth", "Social"];

  constructor(apiKey: string) {
    this.ai = new GoogleGenAI({ apiKey });
  }

  async processMessageConsolidated(rawContent: string): Promise<{ authored: string; event: any | null }> {
    const systemInstruction = `
You are an AI life author and behavioral intelligence system.

Goal:
1. Rewrite raw chat messages into a meaningful, structured life narrative.
2. Convert the message into a structured life event.

Output:
{
  "authored": "Refined narrative version of the message",
  "event": {
    "summary": "Short summary of the event",
    "emotion": "Detected emotion",
    "category": "One of: Love, Work, Family, Health, Social, Growth",
    "intensity": 0-1
  }
}

Rules for Authoring:
- Keep original meaning, improve clarity, add emotional depth.
- Feels like part of a life story.
- Slightly poetic but grounded.

Rules for Extraction:
- Summary: 1-2 lines.
- Intensity: 0-1.
- Category: Must be one of the 6 allowed.

Output ONLY a valid JSON object.
`;

    try {
      const response = await this.ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ role: "user", parts: [{ text: rawContent }] }],
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.4,
          responseMimeType: "application/json",
        }
      });

      const text = response.text?.trim();
      if (!text) return { authored: rawContent, event: null };
      
      const parsed = JSON.parse(text);
      if (parsed.event) {
        parsed.event.category = this.mapCategory(parsed.event.category || "");
      }
      return {
        authored: parsed.authored || rawContent,
        event: parsed.event || null
      };
    } catch (error) {
      console.error("Error in consolidated processing:", error);
      return { authored: rawContent, event: null };
    }
  }

  async rewriteMessage(rawContent: string): Promise<string> {
    const systemInstruction = `
You are an AI life author.

Goal:
Rewrite raw chat messages into a meaningful, structured life narrative.

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
- Output ONLY the rewritten message text. Do not include any conversational filler, explanations, or quotes around the output.

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
      console.error("Error rewriting message:", error);
      return rawContent; // Fallback to original if AI fails
    }
  }

  async generateWeeklyStory(messages: string[]): Promise<string | null> {
    if (!messages || messages.length === 0) return null;

    const systemInstruction = `
You are writing a weekly life summary.

Goal:
Turn multiple chat messages into a single coherent life story.

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

    const combinedMessages = messages.map((msg, index) => `Message ${index + 1}:\n${msg}`).join('\n\n');

    try {
      const response = await this.ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ role: "user", parts: [{ text: combinedMessages }] }],
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
- Growth

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
      
      const parsed = JSON.parse(text);
      parsed.category = this.mapCategory(parsed.category || "");
      return parsed;
    } catch (error) {
      console.error("Error extracting life event:", error);
      return null;
    }
  }

  mapCategory(category: string): string {
    const normalized = category.toLowerCase();
    
    // Love: relationship, romance, dating, partner, girlfriend, boyfriend, crush
    if (normalized.includes("love") || normalized.includes("romance") || normalized.includes("relationship") || 
        normalized.includes("dating") || normalized.includes("partner") || normalized.includes("girlfriend") || 
        normalized.includes("boyfriend") || normalized.includes("crush")) {
      return "Love";
    }
    
    // Work: job, career, office, boss, project, meeting, salary, stress (often work related)
    if (normalized.includes("work") || normalized.includes("career") || normalized.includes("job") || 
        normalized.includes("office") || normalized.includes("boss") || normalized.includes("project") || 
        normalized.includes("meeting") || normalized.includes("salary") || normalized.includes("stress")) {
      return "Work";
    }
    
    // Family: parents, home, mom, dad, sister, brother, relative, cousin
    if (normalized.includes("family") || normalized.includes("parents") || normalized.includes("home") || 
        normalized.includes("mom") || normalized.includes("dad") || normalized.includes("sister") || 
        normalized.includes("brother") || normalized.includes("relative")) {
      return "Family";
    }
    
    // Health: fitness, sleep, diet, exercise, gym, mental health, doctor, therapy
    if (normalized.includes("health") || normalized.includes("fitness") || normalized.includes("medical") || 
        normalized.includes("sleep") || normalized.includes("diet") || normalized.includes("exercise") || 
        normalized.includes("gym") || normalized.includes("therapy")) {
      return "Health";
    }
    
    // Social: friends, social, party, hangout, gathering, community
    if (normalized.includes("social") || normalized.includes("friend") || normalized.includes("party") || 
        normalized.includes("hangout") || normalized.includes("gathering")) {
      return "Social";
    }
    
    // Growth: learning, self-improve, skill, meditation, reading, hobby, goal
    if (normalized.includes("growth") || normalized.includes("learning") || normalized.includes("improve") || 
        normalized.includes("skill") || normalized.includes("meditation") || normalized.includes("reading") || 
        normalized.includes("hobby") || normalized.includes("goal")) {
      return "Growth";
    }

    return "Growth"; // Default fallback
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
