export interface SealingResult {
  title: string;
  content: string;
  alterations: string[];
}

export const libraryService = {
  async getSealedPreview(chapterId: string): Promise<SealingResult> {
    const response = await fetch('/api/library/publish/preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chapterId })
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Failed to generate privacy seal preview');
    }

    return response.json();
  },

  async publishStory(chapterId: string, sealedData?: { sealedTitle: string; sealedContent: string }): Promise<any> {
    const response = await fetch('/api/library/publish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chapterId, ...sealedData })
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Failed to publish story');
    }

    return response.json();
  }
};
