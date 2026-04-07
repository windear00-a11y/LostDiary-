/**
 * Weekly Insight Generator
 * Generates a single, impactful line summarizing the user's week.
 */

import { PatternReport } from "./pattern-detector";

const LAST_INSIGHT_DATE_KEY = 'windear_last_weekly_insight_date';

export const weeklyInsightGenerator = {
  /**
   * Checks if a weekly insight should be shown (once every 7 days).
   */
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

  /**
   * Records that an insight was shown today.
   */
  recordInsightShown(): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(LAST_INSIGHT_DATE_KEY, Date.now().toString());
  },

  /**
   * Generates a human-like one-liner based on weekly patterns.
   */
  generateWeeklyInsight(patterns: PatternReport): string {
    const { emotional_trend, dominant_emotion, recurring_topics } = patterns;
    const topTopic = recurring_topics.length > 0 ? recurring_topics[0] : null;

    // 1. Improving Trend
    if (emotional_trend === "improving") {
      if (topTopic) {
        return `इस हफ्ते तुमने ${topTopic} से जुड़ी चीज़ों को काफी बेहतर handle किया।`;
      }
      return "इस हफ्ते तुम्हारी energy में एक positive बदलाव दिखा, proud of you.";
    }

    // 2. Declining Trend
    if (emotional_trend === "declining") {
      if (topTopic) {
        return `लगता है ${topTopic} की वजह से ये हफ्ता थोड़ा heavy रहा तुम्हारे लिए।`;
      }
      return "ये हफ्ता थोड़ा मुश्किल था, पर याद रखना कि it's okay to have low days.";
    }

    // 3. Stable / Neutral
    if (dominant_emotion === "positive") {
      return "एक खुशहाल और steady हफ्ता—तुमने अपनी vibe बहुत अच्छी रखी।";
    }

    if (topTopic) {
      return `इस पूरे हफ्ते ${topTopic} तुम्हारे ज़हन में छाया रहा, पर तुमने balance बनाए रखा।`;
    }

    return "एक steady हफ्ता रहा—तुमने अपनी emotional balance अच्छे से बनाए रखी।";
  }
};
