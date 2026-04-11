export interface EventMetrics {
  emotion_intensity: number; // 0-5
  personal_relevance: number; // 0-5
  frequency_weight: number; // 0-3
  uniqueness: number; // 0-2
}

export interface ScoredEvent {
  score: number;
  eventType: 'minor' | 'major' | 'discard';
}

export function calculateEventScore(metrics: EventMetrics): ScoredEvent {
  const emotion = Math.min(5, Math.max(0, metrics.emotion_intensity || 0));
  const relevance = Math.min(5, Math.max(0, metrics.personal_relevance || 0));
  const frequency = Math.min(3, Math.max(0, metrics.frequency_weight || 0));
  const uniqueness = Math.min(2, Math.max(0, metrics.uniqueness || 0));

  const score = emotion + relevance + frequency + uniqueness;

  let eventType: 'minor' | 'major' | 'discard' = 'discard';
  
  if (score > 7) {
    eventType = 'major';
  } else if (score >= 4) {
    eventType = 'minor';
  }

  return { score, eventType };
}
