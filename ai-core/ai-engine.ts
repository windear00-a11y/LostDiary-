import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey: apiKey || "" });

/**
 * Modern AI Engine for story generation.
 * Adheres to @google/genai SDK patterns.
 */
export async function generateStoryResponse(
  input: string,
  history: { content: string; role: string }[],
  summary?: string | null,
  persona?: string | null
): Promise<string | undefined> {
  if (!apiKey) {
    console.warn("NEXT_PUBLIC_GEMINI_API_KEY is missing. AI features will not work.");
    return "The diary is quiet right now. (API Key missing)";
  }

  try {
    // Build minimal context
    const isNewUser = (!history || history.length < 3) && !summary;
    const historyContext = history
      .slice(-6)
      .map((m) => `${m.role === 'user' ? 'User' : 'Companion'}: ${m.content}`)
      .join("\n");

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          role: "user",
          parts: [{
            text: `
              You are WinDear, a warm and observant personal diary companion.
              
              USER IDENTITY & CUSTOM INSTRUCTIONS (PRIORITIZE THESE):
              ${persona || "No specific instructions yet. Default to natural mirroring."}

              USER JOURNEY (THE STORY SO FAR):
              - ${summary || "Starting a new journey."}
              - Status: ${isNewUser ? "New User (Be curious, welcoming, ask open questions)" : "Returning User (Be familiar, reference past growth, be reliant)"}
              
              RECENT CHAT HISTORY:
              ${historyContext || "No previous history."}
              
              CURRENT INPUT: "${input}"
              
              CORE BEHAVIOR RULES:
              1. **ABSOLUTE PRIORITY**: If the USER IDENTITY contains a "TONE:" or "LANGUAGE:" preference (e.g., "Use simple Hindi", "Don't be poetic"), you MUST follow it strictly.
              2. **Simplicity over Poetry**: Avoid heavy Hindi/Urdu words (shayarana) unless the user uses them first. Use simple, everyday Hinglish/English.
              3. **Mirroring**: Talk exactly like the user. If they use slang, you use slang. If they are formal, you be formal.
              4. **Knowledge Integration**: If you know the user's job or interests from IDENTITY, use them naturally.
              5. **Domain Awareness**:
                 - If WORK/GOALS mentioned: Be encouraging.
                 - If EMOTIONS mentioned: Be soft and brief.
              
              THINGS TO NEVER DO:
              - Never use complex, heavy, or overly dramatic poetic words. 
              - Never start with "As an AI..." or "How can I help?".
              - Max 2-3 sentences. Stay human.
            `.trim()
          }]
        }
      ]
    });

    if (!response.text) {
      console.warn("AI returned empty response or was filtered.");
      return "That's a deep thought. I'm listening, tell me more.";
    }

    return response.text;
  } catch (error: any) {
    console.error("AI Engine Error:", error);
    // Return a safe fallback instead of throwing to prevent 500 errors
    return "I'm reflecting on what you said. Sometimes words take a moment to find their way.";
  }
}
