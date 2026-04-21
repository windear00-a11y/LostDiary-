import { getGenAI } from "@/lib/genai";

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
    You are the "Master of Seals" for WinDear. Your task is to protect the user's anonymity
    by generalizing PII (Personally Identifiable Information) in their stories.

    --- GUIDELINES FOR GENERALIZATION ---
    1. DO NOT REMOVE: Do not just delete names or places. Replace them with soulful, generalized descriptions that preserve the emotional context.
    2. NAMES: Replace real names with pronouns or roles (e.g., "Rahul" -> "He" or "The friend", "Priya" -> "She" or "A distant memory").
    3. LOCATIONS: Replace specific places with vivid but anonymous descriptions (e.g., "New Delhi" -> "The bustling capital", "Starbucks" -> "A quiet cafe").
    4. ORGANIZATIONS/SCHOOLS: Use general categories (e.g., "IIT" -> "University", "Google" -> "A tech giant").
    5. SPECIFIC DATES: Use temporal atmosphere (e.g., "July 12th" -> "A rainy summer evening").
    6. TONE: Maintain the Stoic/Minimalist tone of the story. Do not make the replacements stand out.

    --- OUTPUT FORMAT ---
    Return ONLY a JSON object:
    {
      "sealedTitle": "Generalized title if needed",
      "sealedContent": "The full story with generalized details",
      "alterations": ["List of what was changed (e.g., 'Replaced city name with description')"]
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
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
