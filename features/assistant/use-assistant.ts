'use client';
import { useState, useCallback } from 'react';
import { generateAIResponse } from '@/ai-core/brain';
import { AIResponse } from '@/ai-core/response-engine';

export const useAssistant = () => {
  const [response, setResponse] = useState<AIResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = useCallback(async (text: string) => {
    if (!text.trim()) return;
    setIsLoading(true);
    try {
      const result = await generateAIResponse(text);
      setResponse(result);
    } catch (error) {
      console.error('Assistant Error:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { response, isLoading, handleSend };
};
