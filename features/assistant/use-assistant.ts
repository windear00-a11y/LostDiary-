'use client';
import { useState, useCallback } from 'react';
import { chatService, ChatMessage } from '@/lib/services/chat-service';
import { authService } from '@/lib/services/auth-service';

export interface AssistantResponse {
  emotion_reflection: string;
  validation: string;
  insight: string;
  gentle_suggestion: string;
  short_reply: string;
}

export const useAssistant = () => {
  const [response, setResponse] = useState<AssistantResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = useCallback(async (text: string) => {
    if (!text.trim()) return;
    setIsLoading(true);
    
    try {
      const user = await authService.getUser();
      if (!user) return;

      // Send message through unified pipeline
      await chatService.sendMessage({
        user_id: user.id,
        type: 'text',
        content: text
      });

      // Fetch latest messages to find the AI response
      const messages = await chatService.fetchMessages(user.id);
      const latestAI = messages.reverse().find(m => m.role === 'diary');

      if (latestAI && latestAI.content) {
        const parts = latestAI.content.split('\n\n');
        setResponse({
          emotion_reflection: parts[0] || '',
          validation: parts[1] || '',
          insight: parts[2]?.replace('Insight: ', '') || '',
          gentle_suggestion: parts[3] || '',
          short_reply: parts[4] || ''
        });
      }
    } catch (error) {
      console.error('Assistant Error:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { response, isLoading, handleSend };
};
