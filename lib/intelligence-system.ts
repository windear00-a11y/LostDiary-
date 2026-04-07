/**
 * Lightweight Intelligence System
 * Detects emotional trends, recurring topics, and risk flags.
 */

export type EmotionalTrend = "improving" | "declining" | "stable";
export type MoodLabel = "positive" | "negative" | "neutral";

export interface IntelligenceReport {
  emotional_trend: EmotionalTrend;
  dominant_emotion: MoodLabel;
  recurring_topics: string[];
  risk_flag: boolean;
}

const POSITIVE_WORDS = ['happy', 'great', 'awesome', 'good', 'love', 'excited', 'wonderful', 'joy', 'blessed', 'proud', 'achieved', 'better', 'calm', 'peaceful', 'hopeful'];
const NEGATIVE_WORDS = ['sad', 'bad', 'angry', 'upset', 'hate', 'terrible', 'worst', 'stressed', 'anxious', 'tired', 'failed', 'lonely', 'overwhelmed', 'exhausted', 'worried'];
const STOP_WORDS = new Set(['the', 'and', 'a', 'to', 'in', 'is', 'i', 'it', 'that', 'was', 'for', 'on', 'are', 'with', 'as', 'be', 'at', 'one', 'have', 'this', 'from', 'or', 'had', 'by', 'but', 'some', 'what', 'there', 'we', 'can', 'out', 'other', 'were', 'all', 'your', 'when', 'up', 'use', 'how', 'said', 'an', 'each', 'she', 'which', 'do', 'their', 'time', 'if', 'will', 'way', 'about', 'many', 'then', 'them', 'write', 'would', 'like', 'so', 'these', 'her', 'long', 'make', 'thing', 'see', 'him', 'two', 'has', 'look', 'more', 'day', 'could', 'go', 'come', 'did', 'no', 'most', 'my', 'over', 'know', 'than', 'who', 'may', 'down', 'been', 'now', 'find']);

export const intelligenceSystem = {
  /**
   * Generates a full intelligence report from a set of entries
   */
  analyze(entries: string[]): IntelligenceReport {
    if (entries.length === 0) {
      return { emotional_trend: "stable", dominant_emotion: "neutral", recurring_topics: [], risk_flag: false };
    }

    const entryAnalysis = entries.map(entry => this.analyzeEntry(entry));
    
    // 1. Dominant Emotion (Mode)
    const moodCounts = entryAnalysis.reduce((acc, curr) => {
      acc[curr.label] = (acc[curr.label] || 0) + 1;
      return acc;
    }, {} as Record<MoodLabel, number>);

    const dominant_emotion = (Object.entries(moodCounts)
      .sort((a, b) => b[1] - a[1])[0][0] as MoodLabel);

    // 2. Emotional Trend
    const emotional_trend = this.calculateTrend(entryAnalysis.map(a => a.score));

    // 3. Recurring Topics
    const recurring_topics = this.extractTopics(entries);

    // 4. Risk Flag
    const risk_flag = this.detectRisk(entryAnalysis, emotional_trend);

    return {
      emotional_trend,
      dominant_emotion,
      recurring_topics,
      risk_flag
    };
  },

  /**
   * Analyzes a single entry for sentiment score and label
   */
  analyzeEntry(content: string): { score: number; label: MoodLabel } {
    const words = content.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/);
    let score = 0;

    words.forEach(word => {
      if (POSITIVE_WORDS.includes(word)) score++;
      if (NEGATIVE_WORDS.includes(word)) score--;
    });

    let label: MoodLabel = "neutral";
    if (score > 0) label = "positive";
    if (score < 0) label = "negative";

    return { score, label };
  },

  /**
   * Calculates trend by comparing recent vs older windows
   */
  calculateTrend(scores: number[]): EmotionalTrend {
    if (scores.length < 2) return "stable";

    const mid = Math.ceil(scores.length / 2);
    const recent = scores.slice(0, mid);
    const older = scores.slice(mid);

    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const olderAvg = older.length > 0 ? older.reduce((a, b) => a + b, 0) / older.length : 0;

    if (recentAvg > olderAvg + 0.2) return "improving";
    if (recentAvg < olderAvg - 0.2) return "declining";
    return "stable";
  },

  /**
   * Extracts top recurring keywords
   */
  extractTopics(entries: string[]): string[] {
    const wordFreq: Record<string, number> = {};

    entries.forEach(entry => {
      const words = new Set(entry.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/));
      words.forEach(word => {
        if (word.length > 3 && !STOP_WORDS.has(word)) {
          wordFreq[word] = (wordFreq[word] || 0) + 1;
        }
      });
    });

    return Object.entries(wordFreq)
      .filter(([_, count]) => count > 1)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([word]) => word);
  },

  /**
   * Detects risk based on trend and consecutive negative entries
   */
  detectRisk(analysis: { score: number; label: MoodLabel }[], trend: EmotionalTrend): boolean {
    if (trend === "declining") return true;

    // Check last 3 entries for consistent negative mood
    const recentLabels = analysis.slice(0, 3).map(a => a.label);
    if (recentLabels.length >= 3 && recentLabels.every(l => l === "negative")) {
      return true;
    }

    return false;
  }
};
