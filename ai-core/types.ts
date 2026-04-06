export type IntentType = 'entry' | 'recall' | 'analysis' | 'chat';

export interface Persona {
  tone: string;
  useEmojis: boolean;
}

export interface AIInsightResponse {
  detected_language: string;
  normalized_content: string;
  translated_content: string;
  mood: string;
  insight: string;
  suggestion: string;
  summary: string;
  tags: string[];
}

export interface WeeklyReflectionResponse {
  trend: string;
  pattern: string;
  suggestion: string;
}

export interface SpellingCheckResponse {
  hasErrors: boolean;
  suggestion: string;
  explanation: string;
}
