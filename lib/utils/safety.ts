import { generateContentWithFallback } from '@/lib/genai-utils';

const TOXICITY_REGEX = /(fuck|bitch|slut|whore|cunt|nigger|faggot|kill yourself|kys|die|suicide)/i;
const PII_REGEX = /(insta|instagram|snap|snapchat|whatsapp|number|phone|follow me|@|dm me)/i;

/**
 * Validates a message sent to another anonymous user.
 * Uses a heuristic check first to save tokens, then falls back to AI.
 * Returns true if SAFE, false if REJECTED.
 */
export async function validateMessageSafety(message: string, context: 'plane' | 'bridge'): Promise<boolean> {
  // 1. Fast Heuristic Check
  if (TOXICITY_REGEX.test(message) || PII_REGEX.test(message)) {
    return false; // Fast Reject
  }

  // Very short, common supportive messages shouldn't cost tokens
  const lowerMsg = message.toLowerCase().trim();
  const safeShorts = ['hi', 'hello', 'how are you', 'im here for you', 'i understand', 'me too', 'thank you', 'thanks'];
  if (message.length < 20 && safeShorts.includes(lowerMsg)) {
    return true; // Fast Accept
  }

  // 2. AI Guardian Check
  const prompt = context === 'plane' 
    ? `
      You are WinDear, an empathetic guardian AI. A user is attempting to send a "Paper Plane" message to an anonymous author of a journal entry.
      Analyze the following message. Is it empathetic, supportive, and completely free of toxicity, romance/flirting, harassment, or PII extraction? We only allow messages that offer genuine resonance.
      Reply ONLY with the exact word "SAFE" if it passes, or "REJECT" if it fails.
      Message: "${message}"
    `
    : `
      You are WinDear, an empathetic silent guardian monitoring an anonymous emotional support chat ("The Bridge").
      Analyze the following message.
      Reject it with "REJECT" if it contains: toxicity, abuse, sexual advances, attempts to extract personally identifiable information (PII / location / real name), spam, or severe hostility.
      Otherwise, reply with "SAFE".
      Message: "${message}"
    `;

  try {
    const response = await generateContentWithFallback({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: { temperature: 0.1 }
    });
    const aiVerdict = response.text?.trim().toUpperCase() || 'REJECT';
    return aiVerdict === 'SAFE';
  } catch (error) {
    console.error(`Safety check failed, defaulting to reject for safety:`, error);
    return false; // Fail secure
  }
}
