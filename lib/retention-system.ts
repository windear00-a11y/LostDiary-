/**
 * Minimal Retention & Streak System
 * Tracks consecutive days of writing and manages smart reminders.
 */

export interface RetentionData {
  lastEntryDate: string | null; // ISO Date string
  streakCount: number;
}

const RETENTION_KEY = 'windear_retention_data';

export const retentionSystem = {
  /**
   * Retrieves retention data from localStorage
   */
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

  /**
   * Updates the streak based on the current date
   */
  updateStreak(): void {
    if (typeof window === 'undefined') return;

    const data = this.getData();
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    
    if (!data.lastEntryDate) {
      // First entry ever
      this.saveData({ lastEntryDate: now.toISOString(), streakCount: 1 });
      return;
    }

    const lastDate = new Date(data.lastEntryDate);
    const lastDay = new Date(lastDate.getFullYear(), lastDate.getMonth(), lastDate.getDate()).getTime();

    const diffDays = Math.floor((today - lastDay) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      // Already wrote today, do nothing
      return;
    } else if (diffDays === 1) {
      // Consecutive day
      this.saveData({ lastEntryDate: now.toISOString(), streakCount: data.streakCount + 1 });
    } else {
      // Missed a day or more, reset streak
      this.saveData({ lastEntryDate: now.toISOString(), streakCount: 1 });
    }
  },

  /**
   * Returns the current streak count
   */
  getStreak(): number {
    const data = this.getData();
    
    // Check if streak should be reset due to inactivity (even if updateStreak hasn't been called)
    if (!data.lastEntryDate) return 0;
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const lastDate = new Date(data.lastEntryDate);
    const lastDay = new Date(lastDate.getFullYear(), lastDate.getMonth(), lastDate.getDate()).getTime();
    
    const diffDays = Math.floor((today - lastDay) / (1000 * 60 * 60 * 24));
    
    if (diffDays > 1) {
      // Streak expired
      return 0;
    }
    
    return data.streakCount;
  },

  /**
   * Determines if a reminder should be shown
   * Returns true if user hasn't written today
   */
  shouldRemind(): boolean {
    const data = this.getData();
    if (!data.lastEntryDate) return true;

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const lastDate = new Date(data.lastEntryDate);
    const lastDay = new Date(lastDate.getFullYear(), lastDate.getMonth(), lastDate.getDate()).getTime();

    return today > lastDay;
  },

  /**
   * Internal helper to save data
   */
  saveData(data: RetentionData): void {
    localStorage.setItem(RETENTION_KEY, JSON.stringify(data));
  }
};
