import { analyzeEntries, EmotionalTrend, MoodLabel } from '@/ai-core/pattern-detector';

/**
 * Lightweight Memory System
 * Stores a summary of recent diary entries in localStorage for quick context.
 */

export interface DiaryMemory {
  recent_entries: string[];
  dominant_emotion: MoodLabel;
  recurring_patterns: string[];
  emotional_trend: EmotionalTrend;
  risk_flag: boolean;
  last_entry_at?: number; // Timestamp of the last entry
}

const MEMORY_KEY = 'windear_ai_memory';
const MAX_ENTRIES = 10;

export const memorySystem = {
  /**
   * Retrieves the current memory from localStorage
   */
  getMemory(): DiaryMemory {
    if (typeof window === 'undefined') {
      return { recent_entries: [], dominant_emotion: 'neutral', recurring_patterns: [], emotional_trend: 'stable', risk_flag: false };
    }
    
    const stored = localStorage.getItem(MEMORY_KEY);
    if (!stored) {
      return { recent_entries: [], dominant_emotion: 'neutral', recurring_patterns: [], emotional_trend: 'stable', risk_flag: false };
    }
    
    try {
      return JSON.parse(stored);
    } catch {
      return { recent_entries: [], dominant_emotion: 'neutral', recurring_patterns: [], emotional_trend: 'stable', risk_flag: false };
    }
  },

  /**
   * Saves a new entry to the memory and updates signals
   */
  saveEntry(content: string): void {
    if (typeof window === 'undefined' || !content.trim()) return;

    const memory = this.getMemory();
    
    // Add new entry and keep only the last MAX_ENTRIES
    const updatedEntries = [content, ...memory.recent_entries].slice(0, MAX_ENTRIES);
    
    // Extract new signals using the pattern detector
    const report = analyzeEntries(updatedEntries);
    
    const newMemory: DiaryMemory = {
      recent_entries: updatedEntries,
      dominant_emotion: report.dominant_emotion,
      recurring_patterns: report.recurring_topics,
      emotional_trend: report.emotional_trend,
      risk_flag: report.risk_flag,
      last_entry_at: Date.now()
    };
    
    localStorage.setItem(MEMORY_KEY, JSON.stringify(newMemory));
  }
};
