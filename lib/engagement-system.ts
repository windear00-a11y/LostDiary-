import { memorySystem, DiaryMemory } from './memory-system';

/**
 * Unified Engagement System
 * Manages streaks, retention, and proactive nudges.
 */

export interface RetentionData {
  lastEntryDate: string | null; // ISO Date string
  streakCount: number;
}

export interface Nudge {
  id: string;
  message: string;
  priority: number;
}

const RETENTION_KEY = 'windear_retention_data';
const LAST_NUDGE_TIME_KEY = 'windear_last_nudge_time';
const NUDGE_COOLDOWN_HOURS = 6;

export const engagementSystem = {
  // --- Retention & Streak Logic ---

  getData(): RetentionData {
    if (typeof window === 'undefined') {
      return { lastEntryDate: null, streakCount: 0 };
    }
    const stored = localStorage.getItem(RETENTION_KEY);
    if (!stored) return { lastEntryDate: null, streakCount: 0 };
    try {
      return JSON.parse(stored);
    } catch {
      return { lastEntryDate: null, streakCount: 0 };
    }
  },

  updateStreak(): void {
    if (typeof window === 'undefined') return;

    const data = this.getData();
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    
    if (!data.lastEntryDate) {
      this.saveData({ lastEntryDate: now.toISOString(), streakCount: 1 });
      return;
    }

    const lastDate = new Date(data.lastEntryDate);
    const lastDay = new Date(lastDate.getFullYear(), lastDate.getMonth(), lastDate.getDate()).getTime();
    const diffDays = Math.floor((today - lastDay) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return;
    else if (diffDays === 1) {
      this.saveData({ lastEntryDate: now.toISOString(), streakCount: data.streakCount + 1 });
    } else {
      this.saveData({ lastEntryDate: now.toISOString(), streakCount: 1 });
    }
  },

  getStreak(): number {
    const data = this.getData();
    if (!data.lastEntryDate) return 0;
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const lastDate = new Date(data.lastEntryDate);
    const lastDay = new Date(lastDate.getFullYear(), lastDate.getMonth(), lastDate.getDate()).getTime();
    const diffDays = Math.floor((today - lastDay) / (1000 * 60 * 60 * 24));
    
    if (diffDays > 1) return 0;
    return data.streakCount;
  },

  shouldRemind(): boolean {
    const data = this.getData();
    if (!data.lastEntryDate) return true;

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const lastDate = new Date(data.lastEntryDate);
    const lastDay = new Date(lastDate.getFullYear(), lastDate.getMonth(), lastDate.getDate()).getTime();

    return today > lastDay;
  },

  saveData(data: RetentionData): void {
    localStorage.setItem(RETENTION_KEY, JSON.stringify(data));
  },

  // --- Nudge Logic ---

  shouldShowNudge(): boolean {
    if (typeof window === 'undefined') return false;

    const lastShown = localStorage.getItem(LAST_NUDGE_TIME_KEY);
    if (lastShown) {
      const hoursSinceLastNudge = (Date.now() - parseInt(lastShown)) / (1000 * 60 * 60);
      if (hoursSinceLastNudge < NUDGE_COOLDOWN_HOURS) return false;
    }

    return true;
  },

  getNudge(): Nudge | null {
    if (!this.shouldShowNudge()) return null;

    const memory = memorySystem.getMemory();
    const streak = this.getStreak();
    const now = Date.now();
    const lastEntryAt = memory.last_entry_at || 0;
    const hoursSinceLastEntry = (now - lastEntryAt) / (1000 * 60 * 60);

    const nudges: Nudge[] = [];

    if (memory.dominant_emotion === 'negative' && hoursSinceLastEntry > 12 && hoursSinceLastEntry < 48) {
      nudges.push({
        id: 'emotional_followup',
        message: "कल तुम थोड़ा low थे… आज कैसा feel कर रहे हो?",
        priority: 1
      });
    }

    if (hoursSinceLastEntry >= 24 && hoursSinceLastEntry < 72) {
      nudges.push({
        id: 'inactivity',
        message: "आज कुछ share करना चाहोगे?",
        priority: 2
      });
    }

    if (streak > 0 && streak % 3 === 0 && hoursSinceLastEntry >= 12) {
      nudges.push({
        id: 'streak_milestone',
        message: `🔥 ${streak} दिन का streak! Keep it going.`,
        priority: 3
      });
    }

    if (nudges.length === 0) return null;
    
    const nudge = nudges.sort((a, b) => a.priority - b.priority)[0];
    localStorage.setItem(LAST_NUDGE_TIME_KEY, Date.now().toString());
    return nudge;
  }
};
