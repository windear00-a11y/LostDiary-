/**
 * Lightweight Memory System
 * Stores a summary of recent diary entries in localStorage for quick context.
 */

export interface DiaryMemory {
  recent_entries: string[];
  dominant_emotion: string;
  recurring_patterns: string[];
}

const MEMORY_KEY = 'windear_ai_memory';
const MAX_ENTRIES = 10;

const POSITIVE_WORDS = ['happy', 'great', 'awesome', 'good', 'love', 'excited', 'wonderful', 'joy', 'blessed', 'proud', 'achieved'];
const NEGATIVE_WORDS = ['sad', 'bad', 'angry', 'upset', 'hate', 'terrible', 'worst', 'stressed', 'anxious', 'tired', 'failed'];

export const memorySystem = {
  /**
   * Retrieves the current memory from localStorage
   */
  getMemory(): DiaryMemory {
    if (typeof window === 'undefined') {
      return { recent_entries: [], dominant_emotion: 'neutral', recurring_patterns: [] };
    }
    
    const stored = localStorage.getItem(MEMORY_KEY);
    if (!stored) {
      return { recent_entries: [], dominant_emotion: 'neutral', recurring_patterns: [] };
    }
    
    try {
      return JSON.parse(stored);
    } catch {
      return { recent_entries: [], dominant_emotion: 'neutral', recurring_patterns: [] };
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
    
    // Extract new signals
    const signals = this.extractSignals(updatedEntries);
    
    const newMemory: DiaryMemory = {
      recent_entries: updatedEntries,
      dominant_emotion: signals.mood,
      recurring_patterns: signals.topics
    };
    
    localStorage.setItem(MEMORY_KEY, JSON.stringify(newMemory));
  },

  /**
   * Simple heuristic-based signal extraction
   */
  extractSignals(entries: string[]): { mood: string; topics: string[] } {
    if (entries.length === 0) return { mood: 'neutral', topics: [] };

    let positiveCount = 0;
    let negativeCount = 0;
    const wordFreq: Record<string, number> = {};
    
    // Stop words to ignore for patterns
    const stopWords = new Set(['the', 'and', 'a', 'to', 'in', 'is', 'i', 'it', 'that', 'was', 'for', 'on', 'are', 'with', 'as', 'be', 'at', 'one', 'have', 'this', 'from', 'or', 'had', 'by', 'hot', 'but', 'some', 'what', 'there', 'we', 'can', 'out', 'other', 'were', 'all', 'your', 'when', 'up', 'use', 'word', 'how', 'said', 'an', 'each', 'she', 'which', 'do', 'their', 'time', 'if', 'will', 'way', 'about', 'many', 'then', 'them', 'write', 'would', 'like', 'so', 'these', 'her', 'long', 'make', 'thing', 'see', 'him', 'two', 'has', 'look', 'more', 'day', 'could', 'go', 'come', 'did', 'number', 'sound', 'no', 'most', 'people', 'my', 'over', 'know', 'water', 'than', 'call', 'first', 'who', 'may', 'down', 'side', 'been', 'now', 'find']);

    entries.forEach(entry => {
      const words = entry.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/);
      
      words.forEach(word => {
        if (word.length < 3) return;
        
        if (POSITIVE_WORDS.includes(word)) positiveCount++;
        if (NEGATIVE_WORDS.includes(word)) negativeCount++;
        
        if (!stopWords.has(word)) {
          wordFreq[word] = (wordFreq[word] || 0) + 1;
        }
      });
    });

    // Determine mood
    let mood = 'neutral';
    if (positiveCount > negativeCount) mood = 'positive';
    if (negativeCount > positiveCount) mood = 'negative';

    // Determine recurring patterns (top 5 words appearing more than once)
    const topics = Object.entries(wordFreq)
      .filter(([_, count]) => count > 1)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([word]) => word);

    return { mood, topics };
  }
};
