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

const POSITIVE_WORDS = ['happy', 'great', 'awesome', 'good', 'love', 'excited', 'wonderful', 'joy', 'blessed', 'proud', 'achieved', 'better', 'calm', 'peaceful', 'hopeful', 'grateful', 'inspired'];
const NEGATIVE_WORDS = ['sad', 'bad', 'angry', 'upset', 'hate', 'terrible', 'worst', 'stressed', 'anxious', 'tired', 'failed', 'lonely', 'overwhelmed', 'exhausted', 'worried', 'frustrated', 'annoyed'];
const STOP_WORDS = new Set(['the', 'and', 'a', 'to', 'in', 'is', 'i', 'it', 'that', 'was', 'for', 'on', 'are', 'with', 'as', 'be', 'at', 'one', 'have', 'this', 'from', 'or', 'had', 'by', 'but', 'some', 'what', 'there', 'we', 'can', 'out', 'other', 'were', 'all', 'your', 'when', 'up', 'use', 'how', 'said', 'an', 'each', 'she', 'which', 'do', 'their', 'time', 'if', 'will', 'way', 'about', 'many', 'then', 'them', 'write', 'would', 'like', 'so', 'these', 'her', 'long', 'make', 'thing', 'see', 'him', 'two', 'has', 'look', 'more', 'day', 'could', 'go', 'come', 'did', 'no', 'most', 'my', 'over', 'know', 'than', 'who', 'may', 'down', 'been', 'now', 'find', 'just', 'very', 'really']);

/**
 * Detects the dominant emotion of a single entry based on keyword frequency.
 */
export const detectEmotion = (entry: string): { score: number; label: MoodLabel } => {
  const words = entry.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/);
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
 * Extracts recurring topics (keywords) that appear in multiple entries.
 */
export const extractTopics = (entries: string[]): string[] => {
  const wordFreq: Record<string, number> = {};

  entries.forEach(entry => {
    // Use a Set per entry to count "frequency across entries" rather than "total word count"
    const words = new Set(entry.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/));
    words.forEach(word => {
      if (word.length > 3 && !STOP_WORDS.has(word)) {
        wordFreq[word] = (wordFreq[word] || 0) + 1;
      }
    });
  });

  return Object.entries(wordFreq)
    .filter(([_, count]) => count > 1) // Must appear in at least 2 entries
    .sort((a, b) => b[1] - a[1]) // Most frequent first
    .slice(0, 5) // Top 5
    .map(([word]) => word);
};

/**
 * Analyzes a list of entries to detect trends, dominant emotions, and risks.
 * Expects entries in reverse chronological order (newest first).
 */
export const analyzeEntries = (entries: string[]): PatternReport => {
  if (entries.length === 0) {
    return { emotional_trend: "stable", dominant_emotion: "neutral", recurring_topics: [], risk_flag: false };
  }

  const analysis = entries.map(entry => detectEmotion(entry));
  
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
  const recurring_topics = extractTopics(entries);

  // 4. Risk Flag
  // Triggered if trend is declining OR last 3 entries are negative
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

const LAST_INSIGHT_DATE_KEY = 'windear_last_weekly_insight_date';

export const weeklyInsightGenerator = {
  shouldShowWeeklyInsight(): boolean {
    if (typeof window === 'undefined') return false;
    const lastShown = localStorage.getItem(LAST_INSIGHT_DATE_KEY);
    if (!lastShown) return true;

    const lastDate = new Date(parseInt(lastShown));
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - lastDate.getTime());
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    
    return diffDays >= 7;
  },

  recordInsightShown(): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(LAST_INSIGHT_DATE_KEY, Date.now().toString());
  },

  generateWeeklyInsight(patterns: PatternReport): string {
    const { emotional_trend, dominant_emotion, recurring_topics } = patterns;
    const topTopic = recurring_topics.length > 0 ? recurring_topics[0] : null;

    if (emotional_trend === "improving") {
      if (topTopic) {
        return `इस हफ्ते तुमने ${topTopic} से जुड़ी चीज़ों को काफी बेहतर handle किया।`;
      }
      return "इस हफ्ते तुम्हारी energy में एक positive बदलाव दिखा, proud of you.";
    }

    if (emotional_trend === "declining") {
      if (topTopic) {
        return `लगता है ${topTopic} की वजह से ये हफ्ता थोड़ा heavy रहा तुम्हारे लिए।`;
      }
      return "ये हफ्ता थोड़ा मुश्किल था, पर याद रखना कि it's okay to have low days.";
    }

    if (dominant_emotion === "positive") {
      return "एक खुशहाल और steady हफ्ता—तुमने अपनी vibe बहुत अच्छी रखी।";
    }

    if (topTopic) {
      return `इस पूरे हफ्ते ${topTopic} तुम्हारे ज़हन में छाया रहा, पर तुमने balance बनाए रखा।`;
    }

    return "एक steady हफ्ता रहा—तुमने अपनी emotional balance अच्छे से बनाए रखी।";
  }
};
