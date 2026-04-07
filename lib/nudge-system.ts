import { memorySystem, DiaryMemory } from './memory-system';
import { retentionSystem } from './retention-system';

/**
 * Smart Nudge System
 * Proactive messages to encourage user engagement and emotional check-ins.
 */

export interface Nudge {
  id: string;
  message: string;
  priority: number;
}

const LAST_NUDGE_TIME_KEY = 'windear_last_nudge_time';
const NUDGE_COOLDOWN_HOURS = 6; // Don't show nudges more than once every 6 hours

export const nudgeSystem = {
  /**
   * Checks if a nudge should be shown based on cooldown and activity.
   */
  shouldShowNudge(): boolean {
    if (typeof window === 'undefined') return false;

    const lastShown = localStorage.getItem(LAST_NUDGE_TIME_KEY);
    if (lastShown) {
      const hoursSinceLastNudge = (Date.now() - parseInt(lastShown)) / (1000 * 60 * 60);
      if (hoursSinceLastNudge < NUDGE_COOLDOWN_HOURS) {
        return false;
      }
    }

    return true;
  },

  /**
   * Determines the best nudge message based on memory context.
   */
  getNudgeMessage(memory: DiaryMemory): Nudge | null {
    const streak = retentionSystem.getStreak();
    const now = Date.now();
    const lastEntryAt = memory.last_entry_at || 0;
    const hoursSinceLastEntry = (now - lastEntryAt) / (1000 * 60 * 60);

    const nudges: Nudge[] = [];

    // 1. Emotional Follow-up (Priority 1)
    if (memory.dominant_emotion === 'negative' && hoursSinceLastEntry > 12 && hoursSinceLastEntry < 48) {
      nudges.push({
        id: 'emotional_followup',
        message: "कल तुम थोड़ा low थे… आज कैसा feel कर रहे हो?",
        priority: 1
      });
    }

    // 2. Inactivity Nudge (Priority 2)
    if (hoursSinceLastEntry >= 24 && hoursSinceLastEntry < 72) {
      nudges.push({
        id: 'inactivity',
        message: "आज कुछ share करना चाहोगे?",
        priority: 2
      });
    }

    // 3. Streak Milestone (Priority 3)
    if (streak > 0 && streak % 3 === 0 && hoursSinceLastEntry >= 12) {
      nudges.push({
        id: 'streak_milestone',
        message: `🔥 ${streak} दिन का streak! Keep it going.`,
        priority: 3
      });
    }

    if (nudges.length === 0) return null;
    
    return nudges.sort((a, b) => a.priority - b.priority)[0];
  },

  /**
   * Main entry point to get a nudge and update the last shown time.
   */
  getNudge(): Nudge | null {
    if (!this.shouldShowNudge()) return null;

    const memory = memorySystem.getMemory();
    const nudge = this.getNudgeMessage(memory);

    if (nudge) {
      localStorage.setItem(LAST_NUDGE_TIME_KEY, Date.now().toString());
    }

    return nudge;
  }
};
