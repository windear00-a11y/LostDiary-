/**
 * AI Pattern Detector
 * Processes raw entries or extracted metadata to generate actionable insights.
 */

export interface PatternReport {
  emotional_trend: "improving" | "declining" | "stable";
  dominant_emotions: { emotion: string, count: number }[];
  top_triggers: { trigger: string, count: number }[];
  repeating_tags: { tag: string, count: number }[];
  total_analyzed: number;
  highlighted_insight: string;
}

export const analyzeEntries = (messages: any[]): PatternReport => {
  // Messages here should be the raw objects from Supabase containing metadata
  const emotionsMap: Record<string, number> = {};
  const triggersMap: Record<string, number> = {};
  const tagsMap: Record<string, number> = {};
  
  let validMessagesCount = 0;

  for (const msg of messages) {
    if (msg.role !== 'user' || !msg.metadata) continue;
    validMessagesCount++;

    const meta = msg.metadata;

    if (meta.emotion) {
      emotionsMap[meta.emotion] = (emotionsMap[meta.emotion] || 0) + 1;
    }
    
    if (meta.trigger && meta.trigger !== 'unknown') {
      const triggerLower = meta.trigger.toLowerCase();
      triggersMap[triggerLower] = (triggersMap[triggerLower] || 0) + 1;
    }

    if (meta.tags && Array.isArray(meta.tags)) {
      meta.tags.forEach((t: string) => {
        const tagLower = t.toLowerCase();
        tagsMap[tagLower] = (tagsMap[tagLower] || 0) + 1;
      });
    }
  }

  const sortMap = (map: Record<string, number>) => {
    return Object.entries(map)
      .map(([key, count]) => ({ [key === 'emotion' ? 'emotion' : key === 'trigger' ? 'trigger' : 'tag']: key, count }))
      .sort((a, b) => b.count - a.count);
  };

  const topTags = Object.entries(tagsMap).map(([tag, count]) => ({ tag, count })).sort((a,b) => b.count - a.count);
  const topTriggers = Object.entries(triggersMap).map(([trigger, count]) => ({ trigger, count })).sort((a,b) => b.count - a.count);
  const topEmotions = Object.entries(emotionsMap).map(([emotion, count]) => ({ emotion, count })).sort((a,b) => b.count - a.count);

  let highlighted_insight = "Keep writing to uncover patterns.";
  if (topTags.length > 0 && topTags[0].count > 1) {
    highlighted_insight = `In recent days, you've touched deeply on '${topTags[0].tag}' ${topTags[0].count} times. The pattern is becoming clear.`;
  }

  return {
    emotional_trend: "stable",
    dominant_emotions: topEmotions.slice(0, 3),
    top_triggers: topTriggers.slice(0, 3),
    repeating_tags: topTags.slice(0, 5),
    total_analyzed: validMessagesCount,
    highlighted_insight
  };
};
