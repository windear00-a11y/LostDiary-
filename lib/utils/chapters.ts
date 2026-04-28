/**
 * Chapter Mapping Logic
 * Ensures all life events are categorized into a fixed set of chapters.
 */

const ALLOWED_CHAPTERS = [
  "Love",
  "Work",
  "Family",
  "Health",
  "Growth",
  "Social"
] as const;

type ChapterCategory = typeof ALLOWED_CHAPTERS[number];

/**
 * Maps a raw category string to one of the fixed allowed chapters.
 * Fallback is always "Growth".
 */
export function mapToChapter(category: string | null | undefined): ChapterCategory {
  if (!category) return "Growth";
  
  // Normalize input
  const normalized = category.trim();
  
  // Check if it's in the allowed list (case-sensitive check as per requirement)
  if (ALLOWED_CHAPTERS.includes(normalized as ChapterCategory)) {
    return normalized as ChapterCategory;
  }
  
  // Case-insensitive check for robustness
  const found = ALLOWED_CHAPTERS.find(
    c => c.toLowerCase() === normalized.toLowerCase()
  );
  
  return found || "Growth";
}

const ChapterValidationRules = {
  fixedCategories: ALLOWED_CHAPTERS,
  fallback: "Growth",
  dynamicCreation: "Forbidden",
  mappingLogic: "Strict inclusion check with case-insensitive fallback"
};
