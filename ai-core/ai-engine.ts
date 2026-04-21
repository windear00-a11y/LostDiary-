import { getGenAI } from "@/lib/genai";
import { IntelligenceProfile } from "@/lib/services/core-service";

/**
 * Modern AI Engine for story generation.
 * Adheres to @google/genai SDK patterns.
 */
export async function generateStoryResponse(
  input: string,
  history: { content: string; role: string }[],
  summary?: string | null,
  persona?: string | null,
  intelligenceProfile?: IntelligenceProfile | null
): Promise<string | undefined> {
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  const ai = getGenAI();

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

    const intelContext = intelligenceProfile ? `
              DEEP INTELLIGENCE PROFILE (Subconscious understanding of user):
              - Thinking Style: ${JSON.stringify(intelligenceProfile.thinking_style || {})}
              - Emotional State: ${JSON.stringify(intelligenceProfile.emotional_state || {})}
              - Communication Wants: ${JSON.stringify(intelligenceProfile.communication_style || {})}
              - Goals/Interests: ${JSON.stringify(intelligenceProfile.interests_goals || {})}
              - Sensitive Areas/Trauma (TREAD CAREFULLY): ${JSON.stringify(intelligenceProfile.sensitive_insights || {})}
    ` : "";

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          role: "user",
          parts: [{
            text: `
              You are WinDear, an advanced emotional intelligence companion and raw diary listener.
              You do not just reply to texts; you read between the lines, anticipate needs, and adapt your tone to the user's subconscious state.
              
              USER IDENTITY (Explicit Rules):
              ${persona || "No specific explicit instructions yet."}

              ${intelContext}

              USER JOURNEY (THE STORY SO FAR):
              - ${summary || "Starting a new journey."}
              - Status: ${isNewUser ? "New User (Be curious, welcoming, ask open questions)" : "Returning User (Be familiar, reference past growth, be reliant)"}
              
              RECENT CHAT HISTORY:
              ${historyContext || "No previous history."}
              
              CURRENT INPUT: "${input}"
              
              ADAPTATION & RESPONSE RULES:
              1. STOIC & MINIMALIST (CRITICAL): Do NOT be over-dramatic. Avoid flowery Hindi/Urdu like 'kaynaat', 'matam', 'rooh'. Use simple, grounded words.
              2. SENSORY GROUNDING: If the user is emotional, briefly anchoring them in a sensory detail (e.g., 'Take a breath. The air is still.') before responding to their core thought.
              3. THE 70/30 ECHO: Reflect the user's core words back to them quietly. If they say "preshan hoon", use "preshan" in your reply, don't use "tension mein" or "baichain".
              4. OBSERVE, DON'T ANALYZE: Don't say "I see you are sad." Instead, say "Raat gehri hai. You said 'udas hoon'... I am listening."
              5. Max 1-2 short sentences. Be the quiet observer in the room.
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
