/**
 * Importance Detection Logic
 * Filters chat messages to identify meaningful life events vs casual conversation.
 */

const EMOTION_KEYWORDS = [
  'sad', 'angry', 'hate', 'terrible', 'worst', 'stressed', 'anxious', 'failed', 
  'lonely', 'overwhelmed', 'exhausted', 'worried', 'frustrated', 'annoyed',
  'happy', 'great', 'awesome', 'love', 'excited', 'wonderful', 'joy', 'blessed', 
  'proud', 'grateful', 'inspired', 'kaafi', 'dukh', 'gussa', 'pareshan', 'tension'
];

const INTENT_KEYWORDS = [
  // Reflection/Venting
  'feel', 'thinking', 'thought', 'realized', 'improve', 'change', 'learned',
  'lag raha', 'soch', 'samajh', 'pata chala', 'behtar', 'badal', 'experience',
  'why', 'how', 'what should', 'should i', 'advice', 'help me', 'guide',
  'kya karun', 'kaise', 'advice chahiye', 'help'
];

export function isImportantMessage(message: { content: string | null; type: string }): boolean {
  const content = (message.content || "").trim();
  
  // 1. Media is always important
  if (message.type !== 'text') return true;

  // 2. Length check: Must be at least 20 characters to be considered "meaningful"
  if (content.length < 20) return false;

  // 3. Filter out common casual fillers/greetings
  const isCasualFiller = /^(ok|hmm|haan|theek|hello|hi|hey|bye|good morning|gn|gm|okay|yes|no)/i.test(content);
  if (isCasualFiller) return false;

  // 4. Check for strong emotions or specific intent keywords
  const contentLower = content.toLowerCase();
  const hasEmotion = EMOTION_KEYWORDS.some(word => contentLower.includes(word));
  const hasIntent = INTENT_KEYWORDS.some(word => contentLower.includes(word));

  // LOGIC:
  // Must be meaningful length AND (have emotion OR have intent)
  return hasEmotion || hasIntent;
}

export const ImportanceRules = {
  important: [
    "Contains strong emotion (e.g., 'stress', 'happy', 'tension')",
    "Reflective intent (e.g., 'lag raha hai', 'realized', 'improve')",
    "Meaningful length (> 25 characters)",
    "Media attachments (Images, Audio, Video)"
  ],
  nonImportant: [
    "Short greetings ('Hi', 'Hello')",
    "One-word confirmations ('Ok', 'Haan')",
    "Casual fillers without emotional context"
  ]
};
