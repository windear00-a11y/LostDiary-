import { getGenAI } from "@/lib/genai";
import { generateContentWithFallback } from "@/lib/genai-utils";
import { IntelligenceProfile } from "@/lib/services/core-service";

export const extractIntelligenceProfile = async (
  inputType: 'chat' | 'diary',
  content: string,
  currentProfile: IntelligenceProfile
): Promise<IntelligenceProfile> => {
  const ai = getGenAI();

  const systemInstruction = `
You are an elite psychological profiler and minimalist observer for "WinDear". 
Your goal is to extract deep insights using the "Hybrid Engine" (Stoic/Minimalist) style.

--- ANALYSIS RULES (STOIC/MINIMALIST) ---
1. NO OVER-DRAMA: Do not use labels like "Shattered soul" or "Eternal bond". Use grounded terms like "Vulnerable state" or "Consistent connection".
2. RAW ANCHORING: In your insights, prioritize capturing the EXACT emotional word the user used. 
3. FRAGMENTED TRUTH: Keep descriptions short. Instead of long sentences, use 2-3 word descriptors (e.g., "Mood: Quietly persistent", "Anxiety Trigger: Late-night silence").
4. CONFIDENCE WEIGHTING: Only update deep traits if you see a repeated pattern. Be a cautious observer.

Input Type: [${inputType.toUpperCase()}] 
Current Profile JSON:
${JSON.stringify(currentProfile, null, 2)}

New User Input:
"${content}"

--- THE 7 DIMENSIONS ---
Output the FULL UPDATED JSON. Keep the structure flat and keywords-focused.
{
  "basic_profile": { ... }, 
  "thinking_style": { ... }, 
  "emotional_state": { ... }, 
  "interests_goals": { ... }, 
  "behavior_patterns": { ... }, 
  "communication_style": { ... }, 
  "sensitive_insights": { ... } 
}
Return ONLY JSON. No explanations. Be the quiet observer behind the Mirror.
`;

  try {
    const response = await generateContentWithFallback({
      model: "gemini-3-flash-preview", // Flash is fast and good enough for structured extraction
      contents: [{ role: "user", parts: [{ text: "Process input and output updated profile." }] }],
      config: { 
        systemInstruction, 
        temperature: 0.1, 
        responseMimeType: "application/json" 
      }
    });

    const text = response.text?.trim();
    if (!text) return currentProfile;
    
    const updatedProfile = JSON.parse(text) as IntelligenceProfile;
    
    // Ensure source weights are preserved
    updatedProfile.source_weights = currentProfile.source_weights || { chat: 0.3, diary: 0.7 };
    updatedProfile.last_updated = new Date().toISOString();

    return updatedProfile;

  } catch (error) {
    console.error("Error updating intelligence profile:", error);
    return currentProfile; // Fallback to original if failed
  }
};
