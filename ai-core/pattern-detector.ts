/**
 * AI Pattern Detector
 * Lightweight, logic-based analysis for emotional trends and recurring topics.
 */

export type EmotionalTrend = "improving" | "declining" | "stable";
export type MoodLabel = "positive" | "negative" | "neutral";

export interface PatternReport {
  emotional_trend: EmotionalTrend;
  dominant_emotion: MoodLabel;
  recurring_topics: string[];
  risk_flag: boolean;
}

export interface DiaryMemory {
  recent_messages: string[];
  dominant_emotion: MoodLabel;
  recurring_patterns: string[];
  emotional_trend: EmotionalTrend;
  risk_flag: boolean;
  last_message_at?: number;
}

const POSITIVE_WORDS = ['happy', 'great', 'awesome', 'good', 'love', 'excited', 'wonderful', 'joy', 'blessed', 'proud', 'achieved', 'better', 'calm', 'peaceful', 'hopeful', 'grateful', 'inspired'];
const NEGATIVE_WORDS = ['sad', 'bad', 'angry', 'upset', 'hate', 'terrible', 'worst', 'stressed', 'anxious', 'tired', 'failed', 'lonely', 'overwhelmed', 'exhausted', 'worried', 'frustrated', 'annoyed'];
const STOP_WORDS = new Set(['the', 'and', 'a', 'to', 'in', 'is', 'i', 'it', 'that', 'was', 'for', 'on', 'are', 'with', 'as', 'be', 'at', 'one', 'have', 'this', 'from', 'or', 'had', 'by', 'but', 'some', 'what', 'there', 'we', 'can', 'out', 'other', 'were', 'all', 'your', 'when', 'up', 'use', 'how', 'said', 'an', 'each', 'she', 'which', 'do', 'their', 'time', 'if', 'will', 'way', 'about', 'many', 'then', 'them', 'write', 'would', 'like', 'so', 'these', 'her', 'long', 'make', 'thing', 'see', 'him', 'two', 'has', 'look', 'more', 'day', 'could', 'go', 'come', 'did', 'no', 'most', 'my', 'over', 'know', 'than', 'who', 'may', 'down', 'been', 'now', 'find', 'just', 'very', 'really']);

/**
 * Detects the dominant emotion of a single message based on keyword frequency.
 */
export const detectEmotion = (message: string): { score: number; label: MoodLabel } => {
  const words = message.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/);
  let score = 0;

  words.forEach(word => {
    if (POSITIVE_WORDS.includes(word)) score++;
    if (NEGATIVE_WORDS.includes(word)) score--;
  });

  let label: MoodLabel = "neutral";
  if (score > 0) label = "positive";
  if (score < 0) label = "negative";

  return { score, label };
};

/**
 * Extracts recurring topics (keywords) that appear in multiple messages.
 */
export const extractTopics = (messages: string[]): string[] => {
  const wordFreq: Record<string, number> = {};

  messages.forEach(message => {
    // Use a Set per message to count "frequency across messages" rather than "total word count"
    const words = new Set(message.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/));
    words.forEach(word => {
      if (word.length > 3 && !STOP_WORDS.has(word)) {
        wordFreq[word] = (wordFreq[word] || 0) + 1;
      }
    });
  });

  return Object.entries(wordFreq)
    .filter(([_, count]) => count > 1) // Must appear in at least 2 messages
    .sort((a, b) => b[1] - a[1]) // Most frequent first
    .slice(0, 5) // Top 5
    .map(([word]) => word);
};

/**
 * Analyzes a list of messages to detect trends, dominant emotions, and risks.
 * Expects messages in reverse chronological order (newest first).
 */
export const analyzeEntries = (messages: string[]): PatternReport => {
  if (messages.length === 0) {
    return { emotional_trend: "stable", dominant_emotion: "neutral", recurring_topics: [], risk_flag: false };
  }

  const analysis = messages.map(message => detectEmotion(message));
  
  // 1. Dominant Emotion
  const moodCounts = analysis.reduce((acc, curr) => {
    acc[curr.label] = (acc[curr.label] || 0) + 1;
    return acc;
  }, {} as Record<MoodLabel, number>);

  const dominant_emotion = (Object.entries(moodCounts)
    .sort((a, b) => b[1] - a[1])[0][0] as MoodLabel);

  // 2. Emotional Trend (Recent vs Older)
  const scores = analysis.map(a => a.score);
  let emotional_trend: EmotionalTrend = "stable";
  
  if (scores.length >= 2) {
    const mid = Math.ceil(scores.length / 2);
    const recent = scores.slice(0, mid);
    const older = scores.slice(mid);

    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const olderAvg = older.length > 0 ? older.reduce((a, b) => a + b, 0) / older.length : 0;

    if (recentAvg > olderAvg + 0.2) emotional_trend = "improving";
    else if (recentAvg < olderAvg - 0.2) emotional_trend = "declining";
  }

  // 3. Recurring Topics
  const recurring_topics = extractTopics(messages);

  // 4. Risk Flag
  // Triggered if trend is declining OR last 3 messages are negative
  const recentLabels = analysis.slice(0, 3).map(a => a.label);
  const risk_flag = emotional_trend === "declining" || 
                    (recentLabels.length >= 3 && recentLabels.every(l => l === "negative"));

  return {
    emotional_trend,
    dominant_emotion,
    recurring_topics,
    risk_flag
  };
};
