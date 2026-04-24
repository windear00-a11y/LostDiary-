import { getGenAI } from "@/lib/genai";
import { generateContentWithFallback } from "@/lib/genai-utils";

/**
 * Library Engine handles the "Sealing" (Anonymization/Generalization) of stories
 * before they are published to the Global Library.
 */
export async function sealAndGeneralizeStory(
  title: string,
  content: string
): Promise<{ title: string; content: string; alterations: string[] } | null> {
  const ai = getGenAI();
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

  if (!apiKey) return null;

  const systemInstruction = `
    You are the "Master of Seals", a high-level privacy-first AI engine. Your task is to perform a mandatory "Neural Wash" on user stories to ensure zero leakage of PII (Personally Identifiable Information).

    --- RIGOROUS GENERALIZATION PROTOCOL ---
    1. ZERO LEAKAGE: You MUST identify and neutralize every single specific identifier.
    2. SOUL PRESERVATION: The primary goal is to hide identity, NOT to change the story. The emotional pulse, narrative conflicts, and the "truth" of the moment must remain 100% intact.
    3. REPLACEMENT OVER DELETION: Replace real details with poetic, generalized descriptions that preserve the soul. (e.g., instead of deleting "The blue door at 4th street", use "The blue door that felt like home").
    4. NAMES: Neutralize names by using their relationship or role (e.g., "Rahul" -> "My childhood companion", "Aarav" -> "The person I once trusted").
    5. LOCATIONS & ADDRESSES: Scale up specific locations. (e.g., "Indore" -> "A city known for its warmth", "Hauz Khas" -> "An old artistic corner of the capital").
    6. CONTACT INFO: Strip ALL phone numbers/emails. Replace with "[redacted]".
    7. TEMPORAL CONTINUITY: Keep the flow of time but lose the calendar. (e.g., "Monday morning" -> "The start of a heavy week").
    8. CONTEXTUAL INTEGRITY: If a specific place name is vital to the theme (e.g., a story specifically about Himalayan silence), keep the spirit (e.g., "Mount Everest" -> "The highest peak in the world") instead of just saying "a mountain".
    9. TECHNICAL MASKING: The final output must read naturally, as if written by a human. Avoid clinical or robotic replacements.

    --- OUTPUT FORMAT ---
    Return ONLY a JSON object:
    {
      "sealedTitle": "Generalized title if needed",
      "sealedContent": "The full story with generalized details",
      "alterations": ["List of what was changed (e.g., 'Replaced city name with description')"]
    }
  `;

  try {
    const response = await generateContentWithFallback({
      model: "gemini-3.1-pro-preview",
      contents: [
        {
          role: "user",
          parts: [{ text: `Title: ${title}\nContent: ${content}` }]
        }
      ],
      config: {
        systemInstruction,
        temperature: 0.2,
        responseMimeType: "application/json"
      }
    });

    const text = response.text?.trim();
    if (!text) return null;

    const result = JSON.parse(text);
    return {
      title: result.sealedTitle || title,
      content: result.sealedContent || content,
      alterations: result.alterations || []
    };
  } catch (error) {
    console.error("Sealing Error:", error);
    return null;
  }
}
