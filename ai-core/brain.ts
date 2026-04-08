import { AIResponse } from "./response-engine";
import { analyzeEntries } from "./pattern-detector";

function isImportantMessage(message: any) {
  const content = typeof message === 'string' ? message : (message.content || "");
  const type = typeof message === 'string' ? "text" : (message.type || "text");
  const includesStrongEmotion = /sad|angry|hate|terrible|worst|stressed|anxious|failed|lonely|overwhelmed|exhausted|worried|frustrated|annoyed|happy|great|awesome|love|excited|wonderful|joy|blessed|proud/i.test(content);
  
  return (
    content.length > 80 ||
    includesStrongEmotion ||
    type !== "text"
  );
}

export const generateAIResponse = async (input: string): Promise<AIResponse> => {
  if (!isImportantMessage(input)) {
    return {
      emotion_reflection: "I hear you.",
      validation: "That makes sense.",
      insight: "Sometimes it's just like that.",
      gentle_suggestion: "Take it easy.",
      short_reply: "Got it."
    };
  }

  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";
  
  // 1. Fetch recent messages from DB for context (replacing localStorage memory)
  const { createClient } = await import("@/lib/supabase");
  const supabase = createClient();
  const { data: recentMessages } = await supabase
    .from('chat_messages')
    .select('authored_content, content')
    .eq('role', 'user')
    .order('created_at', { ascending: false })
    .limit(10);

  const contextMessages = recentMessages?.map(m => m.authored_content || m.content || "") || [];
  const patternReport = analyzeEntries(contextMessages);

  // 2. Call backend for tracking and context coordination
  try {
    await fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        input, 
        memory_snapshot: { recent_messages: contextMessages, ...patternReport } 
      })
    });
  } catch (err) {
    console.warn('[AI TRACKING FAILED]', err);
  }
  
  const { ResponseEngine } = await import("./response-engine");
  const engine = new ResponseEngine(apiKey);
  return engine.generateStructuredResponse(input, { recent_messages: contextMessages } as any, patternReport);
};
