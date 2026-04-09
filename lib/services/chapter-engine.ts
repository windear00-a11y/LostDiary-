export const ALLOWED_CHAPTERS = [
  "Love",
  "Work",
  "Family",
  "Health",
  "Growth",
  "Social"
] as const;

export type ChapterTitle = typeof ALLOWED_CHAPTERS[number];

export interface LifeEvent {
  id: string;
  summary: string;
  emotion: string;
  category: string;
  created_at: string;
}

export interface Chapter {
  title: ChapterTitle;
  summary: string;
  events: LifeEvent[];
}

export const chapterEngine = {
  mapToCategory(category: string): ChapterTitle {
    const normalized = category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();
    return ALLOWED_CHAPTERS.includes(normalized as ChapterTitle) 
      ? (normalized as ChapterTitle) 
      : "Growth";
  },

  mergeSimilarEvents(events: LifeEvent[]): LifeEvent[] {
    if (events.length <= 1) return events;

    const merged: LifeEvent[] = [];
    let current = events[0];

    for (let i = 1; i < events.length; i++) {
      const next = events[i];
      
      // Merge if same category and close in time (within 7 days)
      const timeDiff = new Date(next.created_at).getTime() - new Date(current.created_at).getTime();
      if (next.category === current.category && timeDiff < 7 * 24 * 60 * 60 * 1000) {
        current = {
          ...current,
          summary: `${current.summary} ${next.summary}`,
          emotion: next.emotion // Update to latest emotion
        };
      } else {
        merged.push(current);
        current = next;
      }
    }
    merged.push(current);
    return merged;
  },

  organizeChapters(events: LifeEvent[]): Chapter[] {
    const chapterMap = new Map<ChapterTitle, LifeEvent[]>();

    // Initialize map
    ALLOWED_CHAPTERS.forEach(cat => chapterMap.set(cat, []));

    // Sort and Map
    const sortedEvents = [...events].sort((a, b) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    sortedEvents.forEach(event => {
      const category = this.mapToCategory(event.category);
      chapterMap.get(category)!.push(event);
    });

    // Merge and Create Chapters
    return ALLOWED_CHAPTERS.map(title => {
      const rawEvents = chapterMap.get(title) || [];
      const mergedEvents = this.mergeSimilarEvents(rawEvents);
      
      return {
        title,
        summary: this.generateSummary(mergedEvents),
        events: mergedEvents
      };
    });
  },

  generateSummary(events: LifeEvent[]): string {
    if (events.length === 0) return "No events recorded yet.";
    const latest = events[events.length - 1];
    return `Your journey in ${latest.category} has been marked by ${latest.emotion} experiences, culminating in ${latest.summary.slice(0, 50)}...`;
  }
};
