import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey: apiKey || "" });

/**
 * Modern AI Engine for story generation.
 * Adheres to @google/genai SDK patterns.
 */
export async function generateStoryResponse(
  input: string,
  history: { content: string; role: string }[]
): Promise<string | undefined> {
  if (!apiKey) {
    console.warn("NEXT_PUBLIC_GEMINI_API_KEY is missing. AI features will not work.");
    return "The diary is quiet right now. (API Key missing)";
  }

  try {
    // Build minimal context
    const context = history
      .slice(-5)
      .map((m) => `${m.role === 'user' ? 'User' : 'Companion'}: ${m.content}`)
      .join("\n");

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          role: "user",
          parts: [{
            text: `
              You are a personal diary companion named WinDear. Your tone is warm, poetic, and observant.
              The user shares short thoughts or moments with you.
              
              Conversation Context:
              ${context || "No previous history."}
              
              Current Input: "${input}"
              
              TASK:
              - If it's a greeting, respond warmly and invite them to share a memory or a thought.
              - If it's a moment, respond with empathy and a short analytical reflection.
              - Keep it under 2 sentences.
              - Never say "Thinking..." or "UserInput:".
            `.trim()
          }]
        }
      ]
    });

    return response.text;
  } catch (error) {
    console.error("AI Engine Error:", error);
    throw error;
  }
}
