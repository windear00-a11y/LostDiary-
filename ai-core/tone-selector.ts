/**
 * AI Tone Selector
 * Determines the appropriate personality mode based on emotional context.
 */

import { PatternReport, MoodLabel } from "./pattern-detector";

export type ToneMode = "soft_support" | "friendly_casual" | "deep_reflective" | "light_witty";

export interface ToneContext {
  input: string;
  patterns: PatternReport;
  lastTone?: ToneMode;
}

export const toneSelector = {
  /**
   * Selects the best tone mode based on the current context
   */
  selectTone(context: ToneContext): ToneMode {
    const { input, patterns, lastTone } = context;
    const { dominant_emotion, risk_flag } = patterns;

    let selectedTone: ToneMode;

    // 1. Safety First: If there's a risk or negative emotion, always be soft and supportive.
    if (risk_flag || dominant_emotion === "negative") {
      selectedTone = "soft_support";
    }
    // 2. Depth Check: If the user wrote a lot and is neutral, be deep and reflective.
    else if (input.length > 250 && dominant_emotion === "neutral") {
      selectedTone = "deep_reflective";
    }
    // 3. Spark Check: If the user is positive and brief, occasionally be witty.
    else if (dominant_emotion === "positive" && input.length < 100) {
      // 20% chance for witty, 80% for casual
      selectedTone = Math.random() < 0.2 ? "light_witty" : "friendly_casual";
    }
    // 4. Default: Friendly and casual
    else {
      selectedTone = "friendly_casual";
    }

    // Controlled Randomness: If the selected tone is the same as the last tone, 
    // and it's not a "Safety First" situation, try to rotate if context allows.
    if (selectedTone === lastTone && !risk_flag && dominant_emotion !== "negative") {
      if (selectedTone === "friendly_casual" && input.length > 150) {
        selectedTone = "deep_reflective";
      } else if (selectedTone === "deep_reflective") {
        selectedTone = "friendly_casual";
      }
    }

    return selectedTone;
  },

  /**
   * Returns specific instructions for the AI based on the selected tone
   */
  getToneInstructions(mode: ToneMode): string {
    const instructions: Record<ToneMode, string> = {
      soft_support: `
TONE: Soft & Supportive.
- Use gentle, empathetic language.
- Prioritize validation over advice.
- Avoid being overly cheerful or using high-energy emojis.
- Focus on making the user feel safe and heard.
`,
      friendly_casual: `
TONE: Friendly & Casual.
- Use warm, conversational language (Gen-Z casual).
- Be supportive like a close friend.
- Use light emojis to keep the vibe approachable.
- Keep sentences natural and not too formal.
`,
      deep_reflective: `
TONE: Deep & Reflective.
- Use thoughtful, slightly more structured language.
- Focus on insights and "the bigger picture."
- Be calm and analytical without being cold.
- Acknowledge the depth of the user's thoughts.
`,
      light_witty: `
TONE: Light & Witty.
- Be playful and slightly clever.
- Use higher energy and positive emojis.
- Keep it brief and bright.
- Only use this because the user is in a great mood!
`
    };

    return instructions[mode];
  }
};
