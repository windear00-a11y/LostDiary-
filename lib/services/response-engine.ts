export interface Message {
  content: string;
  emotion?: string;
  type?: string;
}

export function getImportanceScore(message: Message): number {
  let score = 0;

  if (message.content.length > 80) score += 0.3;
  if (message.type !== "text") score += 0.2;
  if (message.emotion === "negative" || message.emotion === "high") score += 0.3;
  if (message.content.includes("?")) score += 0.2;

  return score;
}

export const responseEngine = {
  isImportantMessage(message: Message, patterns?: any): boolean {
    const score = getImportanceScore(message);
    const isRepeated = patterns && patterns.isPatternDetected;
    
    return score > 0.5 || !!isRepeated;
  }
};
