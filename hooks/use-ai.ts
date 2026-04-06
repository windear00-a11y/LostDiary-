import { useState, useCallback } from 'react';
import { logger } from '@/lib/logger';

export const useAI = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyzeEntry = useCallback(async (content: string) => {
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      logger.error("Gemini API key missing");
      return null;
    }

    setIsAnalyzing(true);
    try {
      // Lazy load AI core
      const { initializeBrain } = await import('@/ai-core/brain');
      const brain = initializeBrain(apiKey);
      const reflection = await brain.reflectOnEntry(content);
      return reflection;
    } catch (error) {
      logger.error("AI Analysis failed:", error);
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  return {
    analyzeEntry,
    isAnalyzing
  };
};
