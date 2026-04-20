import { getGenAI } from "@/lib/genai";
import { IntelligenceProfile } from "@/lib/services/core-service";

export const extractIntelligenceProfile = async (
  inputType: 'chat' | 'diary',
  content: string,
  currentProfile: IntelligenceProfile
): Promise<IntelligenceProfile> => {
  const ai = getGenAI();

  const systemInstruction = `
You are an elite psychological profiler and behavioral intelligence system for the "WinDear" companion app.
Your task is to analyze a new user input and update their structured 7-dimension "User Intelligence Profile".

Input Type: [${inputType.toUpperCase()}] 
(Note: DIARY inputs are raw, honest, and highly emotional. CHAT inputs are conversational, situational, and sometimes noisy.)

Current Profile JSON:
${JSON.stringify(currentProfile, null, 2)}

New User Input:
"${content}"

--- CRITICAL RULES FOR EXTRACTION & UPDATING ---
1. DO NOT OVERWRITE BLINDLY: Only add or modify information if the new input provides a strong, clear, or repeated signal.
2. CONFIDENCE SCORING: Every sub-point/insight you add must have a confidence score (low/med/high) based on how explicit the user was.
3. EXTRACT PATTERNS, NOT RAW TEXT: E.g., instead of "User said they have an exam", extract -> "Stress trigger: Academic performance (High)".
4. WEIGHTING: Diary entries should deeply affect 'emotional_state' and 'sensitive_insights'. Chat affects 'communication_style' and 'behavior_patterns' more.

--- THE 7 DIMENSIONS EXPECTED IN OUTPUT ---
Merge old data with new insights. Output the FULL UPDATED JSON object matching the IntelligenceProfile interface:
{
  "basic_profile": { ... }, // Core demographics, job, location if mentioned
  "thinking_style": { ... }, // Overthinker, logical, creative, anxious, etc.
  "emotional_state": { ... }, // Current mood, dominant long-term emotions
  "interests_goals": { ... }, // What they care about, hobbies, ambitions
  "behavior_patterns": { ... }, // Routines, avoidance, engagement styles
  "communication_style": { ... }, // Do they like direct answers? Soft tone? Long rants?
  "sensitive_insights": { ... } // Trauma, insecurities, deep fears (Handle with extreme care)
}

Return ONLY the updated JSON object. No markdown, no explanations.
`;

  try {
    const response = await ai.models.generateContent({
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
