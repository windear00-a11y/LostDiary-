import { LifeAuthorEngine } from "@/ai-core/life-author";

export const eventEngine = {
  async extractEvent(content: string, apiKey: string): Promise<{ 
    summary: string; 
    emotion: string; 
    category: string; 
    intensity: number; 
    context: string 
  } | null> {
    const authorEngine = new LifeAuthorEngine(apiKey);
    return await authorEngine.extractLifeEvent(content);
  }
};
