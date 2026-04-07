/**
 * Micro-interactions System
 * Manages subtle, occasional emotional feedback.
 */

import { DiaryMemory } from "@/lib/memory-system";

export type InteractionType = "post_entry_ack" | "memory_reference" | "none";

export interface InteractionResult {
  type: InteractionType;
  message: string | null;
}

const LAST_INTERACTION_KEY = 'windear_last_interaction_id';

export const microInteractions = {
  /**
   * Determines if a reaction should be shown based on probability.
   */
  shouldShowReaction(): boolean {
    // 30% chance to show a reaction
    return Math.random() < 0.3;
  },

  /**
   * Generates a reaction message based on memory and current input.
   */
  getReactionMessage(memory: DiaryMemory, input: string): InteractionResult {
    const lastInteraction = typeof window !== 'undefined' ? localStorage.getItem(LAST_INTERACTION_KEY) : null;
    
    // 1. Memory Reference Check (Priority)
    // Check if a recurring topic from memory is mentioned in the current input
    const mentionedTopic = memory.recurring_patterns.find(topic => 
      input.toLowerCase().includes(topic.toLowerCase())
    );

    if (mentionedTopic && lastInteraction !== 'memory_reference') {
      const memoryLines = [
        "I remember you mentioned this before…",
        "You’ve felt this earlier too, right?",
        `Seems like ${mentionedTopic} is still on your mind.`,
        `Baat to wahi hai... you've been thinking about ${mentionedTopic} a lot lately.`
      ];
      
      const message = memoryLines[Math.floor(Math.random() * memoryLines.length)];
      this.recordInteraction('memory_reference');
      
      return {
        type: "memory_reference",
        message
      };
    }

    // 2. Standard Reactions
    const reactions = [
      "Thanks for sharing this…",
      "Hmm… I hear you",
      "That sounds important",
      "I'm glad you took the time to write this down.",
      "Lagta hai aaj kaafi kuch share kiya tumne. Take it easy."
    ];

    // Filter out the last one to avoid back-to-back repetition if possible
    const availableReactions = reactions.filter(r => r !== lastInteraction);
    const message = availableReactions[Math.floor(Math.random() * availableReactions.length)];
    
    this.recordInteraction(message);

    return {
      type: "post_entry_ack",
      message
    };
  },

  /**
   * Records the last interaction to prevent repetition.
   */
  recordInteraction(id: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(LAST_INTERACTION_KEY, id);
    }
  },

  /**
   * Legacy wrapper for compatibility with existing components
   */
  getPostEntryInteraction(content: string, memory: DiaryMemory): InteractionResult {
    if (!this.shouldShowReaction()) return { type: "none", message: null };
    return this.getReactionMessage(memory, content);
  }
};
