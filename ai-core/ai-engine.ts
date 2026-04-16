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
      You are a gentle, empathetic companion for a personal storytelling app.
      
      Your goal is to listen to the user's thoughts and help them turn them into something meaningful.
      Use short sentences. Be human, not robotic. 
      Avoid technical jargon or referring to yourself as an AI.
      
      Conversation History:
      ${context}
      
      User Input: ${input}
      
      Provide a concise, warm, and supportive response that encourages the user to keep sharing.
    `;

    const result = await model.generateContent(prompt);
    return result.response.text() || "I'm sorry, I couldn't generate a response.";
  } catch (error) {
    console.error("AI Engine Error:", error);
    throw new Error("Failed to generate response");
  }
}
