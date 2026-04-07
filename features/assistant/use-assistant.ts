'use client';
import { useState, useCallback } from 'react';
import { generateAIResponse } from '@/ai-core/brain';
import { AIResponse } from '@/ai-core/response-engine';
import { microInteractions } from '@/ai-core/micro-interactions';
import { memorySystem } from '@/lib/memory-system';
import { useMicroInteractionStore } from '@/lib/store/use-micro-interaction-store';

export const useAssistant = () => {
  const [response, setResponse] = useState<AIResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const setMicroInteraction = useMicroInteractionStore((state) => state.setMessage);

  const handleSend = useCallback(async (text: string) => {
    if (!text.trim()) return;
    setIsLoading(true);
    
    // Trigger micro-interaction occasionally while loading
    const memory = memorySystem.getMemory();
    const interaction = microInteractions.getPostEntryInteraction(text, memory);
    if (interaction.message) {
      setMicroInteraction(interaction.message);
    }

    try {
      const result = await generateAIResponse(text);
      setResponse(result);
    } catch (error) {
      console.error('Assistant Error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [setMicroInteraction]);

  return { response, isLoading, handleSend };
};
