/**
 * Quality Detection Logic
 * Filters AI responses to ensure only high-value content is saved.
 */

const GENERIC_PHRASES = [
  "i understand",
  "that sounds tough",
  "keep going",
  "i'm here for you",
  "that's good to hear",
  "i see"
];

export function isHighValueResponse(text: string): boolean {
  const content = text.toLowerCase().trim();

  // 1. Minimum length check
  if (content.length < 50) return false;

  // 2. Check for generic filler phrases
  const isGeneric = GENERIC_PHRASES.some(phrase => content.includes(phrase));
  if (isGeneric) return false;

  // 3. Check for value markers (insight, pattern, nudge)
  const hasInsight = content.includes("noticed") || content.includes("pattern") || content.includes("contrast");
  const hasNudge = content.includes("could help") || content.includes("perhaps") || content.includes("try");
  
  return hasInsight || hasNudge;
}
