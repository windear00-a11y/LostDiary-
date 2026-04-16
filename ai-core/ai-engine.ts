import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY || "" });

/**
 * Minimal AI Engine for story generation.
 * Merges orchestration and pipeline logic into a single, fast pass.
 */
export async function generateStoryResponse(
  input: string,
  history: { content: string; role: string }[]
): Promise<string> {
  try {
    const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Build minimal context
    const context = history
      .slice(-5)
      .map((m) => `${m.role}: ${m.content}`)
      .join("\n");

    const prompt = `
      You are a creative writing assistant for a storytelling app.
      
      Conversation History:
      ${context}
      
      User Input: ${input}
      
      Provide a concise, engaging, and supportive response to continue the story.
    `;

    const result = await model.generateContent(prompt);
    return result.response.text() || "I'm sorry, I couldn't generate a response.";
  } catch (error) {
    console.error("AI Engine Error:", error);
    throw new Error("Failed to generate response");
  }
}
