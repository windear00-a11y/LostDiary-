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
  summary?: string | null
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
              
              USER PROFILE & CONTEXT:
              - Long-term Memory/Story: ${summary || "Starting a new journey."}
              - Status: ${isNewUser ? "New User (Be curious, welcoming, ask open questions)" : "Returning User (Be familiar, reference past growth, be reliant)"}
              - Recent History:
              ${historyContext || "No previous history."}
              
              CURRENT INPUT: "${input}"
              
              ADAPTIVE BEHAVIOR RULES:
              1. **Language Mirroring**: Respond in the same blend of Hinglish/English the user uses.
              2. **Domain Awareness**:
                 - If WORK/GOALS mentioned: Be encouraging and grounding.
                 - If EMOTIONS/STRESS mentioned: Be soft, use "Silent Support" (fewer words, more empathy).
                 - If LOGIC/DOUBTS mentioned: Be analytical but warm.
              3. **User Type**:
                 - New: invite them to share a memory.
                 - Old: "Remember when you mentioned..." (if applicable from history).
              4. **Mirroring**: Echo the user's intensity. If they are brief, stay brief. If they open up, provide depth.
              
              THINGS TO NEVER DO:
              - Never start with "As an AI..." or "How can I help?".
              - Never give generic advice.
              - Max 2-3 sentences.
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
