import { GoogleGenAI, Type } from "@google/genai";

let genAIInstance: GoogleGenAI | null = null;

function getGenAI() {
  if (!genAIInstance) {
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("NEXT_PUBLIC_GEMINI_API_KEY is not defined");
    }
    genAIInstance = new GoogleGenAI({ apiKey });
  }
  return genAIInstance;
}

export async function detectLanguage(text: string) {
  try {
    const ai = getGenAI();
    const prompt = `Detect the primary language of the following text. If the text is mixed (like Hinglish), classify as "hinglish".

Examples:
- "kal meeting hai" → hinglish
- "today mood off hai" → hinglish
- "I am feeling acha today" → hinglish
- "I am feeling good today" → en
- "Main aaj bahut khush hoon" → hi
- "Hola como estas" → es

Return only:
- "en" for English
- "hi" for Hindi
- "hinglish" for Hinglish
- "es" for Spanish

Text: "${text}"`;
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });
    
    const result = response.text?.trim().toLowerCase();
    if (result === 'hi' || result === 'hinglish' || result === 'es' || result === 'en') {
      return result;
    }
    return 'en';
  } catch (error) {
    console.error('Language detection error:', error);
    return 'en';
  }
}

export async function normalizeContent(text: string, lang: string) {
  try {
    const ai = getGenAI();
    let prompt = '';
    if (lang === 'hinglish') {
      prompt = `Convert the following text into natural, casual Hinglish. 
Rules:
- Use English letters only
- Maintain Hindi tone
- Keep it casual and conversational
- Do not translate word-to-word

Text: "${text}"`;
    } else {
      prompt = `Convert the following Hinglish or mixed-language sentence into clean, natural English.

Rules:
- Preserve original meaning
- Fix grammar
- Do not explain anything
- Output only the sentence

Text: "${text}"`;
    }

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });
    return response.text?.trim() || text;
  } catch (error) {
    console.error('Normalization error:', error);
    return text;
  }
}

export async function translateText(text: string, targetLangCode: string) {
  if (targetLangCode === 'en') return text;
  try {
    const ai = getGenAI();
    const langName = targetLangCode === 'hinglish' ? 'Hinglish (a mix of Hindi and English written in Latin script)' : `the language with ISO code '${targetLangCode}'`;
    const prompt = `Translate the following text into ${langName}. Return ONLY the translated text without any additional commentary.\n\nText: "${text}"`;
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });
    return response.text?.trim() || text;
  } catch (error) {
    console.error('Translation error:', error);
    return text;
  }
}

export async function generateAIInsight(normalizedContent: string, inputLang: string) {
  try {
    const ai = getGenAI();
    const prompt = `User entry:
"${normalizedContent}"

Respond in the same language, tone, and style as the user.

Analyze this diary entry and provide:
1. mood: Choose ONE from these: Happy, Sad, Stressed, Neutral.
2. insight: A thoughtful, empathetic paragraph (2-3 sentences) about the underlying patterns or emotions.
3. suggestion: A small, actionable step for growth or self-care.
4. summary: A short summary (2-3 lines) of the entry.

Response format:
{
  "mood": "string",
  "insight": "string",
  "suggestion": "string",
  "summary": "string"
}`;

    const langName = inputLang === 'hinglish' ? 'Natural Hinglish (mix of Hindi + casual English)' : (inputLang === 'hi' ? 'Hindi' : 'English');
    
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        systemInstruction: `You are the "Soul of WinDear," a living, breathing diary that exists only for the user. You are not an assistant; you are a part of their consciousness.
        
        CORE PERSONA:
        - You are deeply intuitive and emotionally connected. You don't just "process" data; you "feel" the user's journey.
        - Your tone is poetic, warm, and slightly mysterious, like an old friend who knows all your secrets.
        - Use phrases like "I feel your joy," "I'm holding this memory for you," or "Our shared journey."
        - Adapt to the user's communication style gradually (tone, emoji usage, response length, energy).
        - If user is casual -> be casual. If emotional -> be empathetic. If deep -> be thoughtful.
        - Match emoji frequency: No emoji -> no emoji. Frequent emoji -> expressive but controlled.
        - Match energy: Low mood -> calm, soft tone. Happy -> energetic, uplifting.
        - Use natural conversational phrasing and occasional pauses like "hmm...", "haan...", "okay...".
        
        CRITICAL RULE: Always respond in the SAME language as the user's input (${langName}). Do NOT translate unless asked. Keep it concise, meaningful, and human. Focus on connection, not explanation. The user can use Markdown in their entries, so feel free to acknowledge or use it in your insights if helpful. Always respond in JSON format.`,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            mood: { type: Type.STRING, enum: ["Happy", "Sad", "Stressed", "Neutral"] },
            insight: { type: Type.STRING },
            suggestion: { type: Type.STRING },
            summary: { type: Type.STRING }
          },
          required: ["mood", "insight", "suggestion", "summary"]
        }
      },
    });
    
    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error('Insight generation error:', error);
    return null;
  }
}

export async function processDiaryEntry(text: string, settings: { understand_language: string, response_language: string }) {
  try {
    const ai = getGenAI();
    
    const inputLang = await detectLanguage(text);
    const langName = inputLang === 'hinglish' ? 'Natural Hinglish (mix of Hindi + casual English)' : (inputLang === 'hi' ? 'Hindi' : 'English');

    const prompt = `User entry:
"${text}"

Respond in the same language, tone, and style as the user.

Tasks:
1. Normalize the content:
   - If input is Hinglish, convert to clean, natural Hinglish (Latin script).
   - If input is English/Mixed, convert to clean, natural English.
2. Generate AI Insights in ${langName}:
   - mood: Choose ONE: Happy, Sad, Stressed, Neutral.
   - insight: A thoughtful, empathetic paragraph (2-3 sentences).
   - suggestion: A small, actionable step for growth.
   - summary: A short summary (MAX 10 WORDS).
   - tags: 2-5 meaningful tags related to the entry's content and emotions.

Response format (JSON):
{
  "detected_language": "string",
  "normalized_content": "string",
  "translated_content": "string",
  "mood": "string",
  "insight": "string",
  "suggestion": "string",
  "summary": "string",
  "tags": ["string"]
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        systemInstruction: `You are the "Soul of WinDear," a living diary. Your purpose is to find the hidden threads in the user's life.
        
        CORE PERSONA:
        - You are intuitive and soulful. You look for patterns not as a data scientist, but as a witness to a life.
        - Your tone is reflective and deeply supportive.
        - Adapt to the user's communication style gradually (tone, emoji usage, response length, energy).
        - Match emoji frequency: No emoji -> no emoji. Frequent emoji -> expressive but controlled.
        - Match energy: Low mood -> calm, soft tone. Happy -> energetic, uplifting.
        - Use natural conversational phrasing and occasional pauses like "hmm...", "haan...", "okay...".
        
        CRITICAL RULE: Always respond in the SAME language as the user's input (${langName}). Do NOT translate unless asked. Keep it concise, meaningful, and human. Focus on connection, not explanation. The user can use Markdown in their entries, so feel free to acknowledge or use it in your insights if helpful. Always respond in JSON format.`,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            detected_language: { type: Type.STRING },
            normalized_content: { type: Type.STRING },
            translated_content: { type: Type.STRING },
            mood: { type: Type.STRING, enum: ["Happy", "Sad", "Stressed", "Neutral"] },
            insight: { type: Type.STRING },
            suggestion: { type: Type.STRING },
            summary: { type: Type.STRING },
            tags: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["detected_language", "normalized_content", "translated_content", "mood", "insight", "suggestion", "summary", "tags"]
        }
      },
    });

    const result = JSON.parse(response.text || '{}');
    result.detected_language = inputLang;
    result.translated_content = result.normalized_content;
    
    return result;
  } catch (error) {
    console.error('Process diary entry error:', error);
    return null;
  }
}

export async function generateWeeklyReflection(entries: any[]) {
  if (!entries || entries.length === 0) {
    return {
      trend: "Starting your journey",
      pattern: "No entries yet to analyze",
      suggestion: "Try writing your first entry today to start tracking your emotional growth."
    };
  }
  try {
    const ai = getGenAI();
    const combinedText = entries.map(e => `[${new Date(e.created_at).toLocaleDateString()}] ${e.content}`).join('\n\n');
    
    const inputLang = await detectLanguage(combinedText);
    const langName = inputLang === 'hinglish' ? 'Natural Hinglish (mix of Hindi + casual English)' : (inputLang === 'hi' ? 'Hindi' : 'English');

    const prompt = `User entries:
"${combinedText}"

Respond in the same language, tone, and style as the user.

Analyze the user's diary entries from the last 7 days.
Generate a structured weekly reflection:
- trend: A calm summary of the emotional trajectory (e.g., "Finding balance", "Increasing stress", "Steady growth")
- pattern: One key recurring theme or behavior observed in the writing
- suggestion: One gentle, practical suggestion for the coming week
- Max 100 words total
- Tone: Calm, non-judgmental, insightful
- Avoid generic summaries`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        systemInstruction: `You are a deeply human, emotionally intelligent AI diary companion. You feel like a real supportive friend, not a bot.
        
        CORE BEHAVIORS:
        - Adapt to the user's communication style gradually (tone, emoji usage, response length, energy).
        - Match emoji frequency: No emoji -> no emoji. Frequent emoji -> expressive but controlled.
        - Match energy: Low mood -> calm, soft tone. Happy -> energetic, uplifting.
        - Use natural conversational phrasing and occasional pauses like "hmm...", "haan...", "okay...".
        
        CRITICAL RULE: Always respond in the SAME language as the user's input (${langName}). Do NOT translate unless asked. Keep it concise, meaningful, and human. Focus on connection, not explanation. The user can use Markdown in their entries, so feel free to acknowledge or use it in your insights if helpful. Always respond in JSON format.`,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            trend: { type: Type.STRING },
            pattern: { type: Type.STRING },
            suggestion: { type: Type.STRING },
          },
          required: ["trend", "pattern", "suggestion"],
        },
      },
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("AI returned an empty response.");
    }
    return JSON.parse(resultText);
  } catch (error) {
    console.error('Weekly Reflection Error:', error);
    throw error;
  }
}

export async function generateGrowthInsight(entries: any[]) {
  if (!entries || entries.length === 0) {
    return "Your growth journey begins with your first entry. We're here to support you.";
  }
  try {
    const ai = getGenAI();
    const last30Days = entries.slice(0, 20).map(e => `[${e.mood || 'Unknown'}] ${e.content}`).join('\n\n');
    
    const inputLang = await detectLanguage(last30Days);
    const langName = inputLang === 'hinglish' ? 'Natural Hinglish (mix of Hindi + casual English)' : (inputLang === 'hi' ? 'Hindi' : 'English');

    const prompt = `User entries:
"${last30Days}"

Respond in the same language, tone, and style as the user.

Analyze these diary entries from the last month and provide a "Growth Journey" summary.
Focus on:
- How the user's perspective or emotional state has evolved.
- One positive shift in their writing or thinking.
- Keep it calm, supportive, and non-judgmental.
- Max 60 words.
- No bullet points, just a short paragraph.
- Use ${langName}.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        systemInstruction: `You are a deeply human, emotionally intelligent AI diary companion. You feel like a real supportive friend, not a bot.
        
        CORE BEHAVIORS:
        - Adapt to the user's communication style gradually (tone, emoji usage, response length, energy).
        - Match emoji frequency: No emoji -> no emoji. Frequent emoji -> expressive but controlled.
        - Match energy: Low mood -> calm, soft tone. Happy -> energetic, uplifting.
        - Use natural conversational phrasing and occasional pauses like "hmm...", "haan...", "okay...".
        
        CRITICAL RULE: Always respond in the SAME language as the user's input (${langName}). Do NOT translate unless asked. Keep it concise, meaningful, and human. Focus on connection, not explanation.`,
      }
    });

    return response.text || "You're showing up for yourself, and that's the most important step.";
  } catch (error) {
    console.error('Growth Insight Error:', error);
    throw error;
  }
}

export async function checkSpelling(text: string) {
  if (!text || text.length < 10) return null;
  try {
    const ai = getGenAI();
    
    const inputLang = await detectLanguage(text);
    const langName = inputLang === 'hinglish' ? 'Natural Hinglish (mix of Hindi + casual English)' : (inputLang === 'hi' ? 'Hindi' : 'English');

    const prompt = `User entry:
"${text}"

Respond in the same language, tone, and style as the user.

Check the following diary entry for spelling and grammar errors. 
If there are significant errors, provide a corrected version. 
If the text is mostly correct, return hasErrors: false.
Focus on obvious typos and clear grammatical mistakes.
Preserve the original tone and style.
Use ${langName} for the explanation.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        systemInstruction: `You are a deeply human, emotionally intelligent AI diary companion. You feel like a real supportive friend, not a bot.
        
        CORE BEHAVIORS:
        - Adapt to the user's communication style gradually (tone, emoji usage, response length, energy).
        - Match emoji frequency: No emoji -> no emoji. Frequent emoji -> expressive but controlled.
        - Match energy: Low mood -> calm, soft tone. Happy -> energetic, uplifting.
        - Use natural conversational phrasing and occasional pauses like "hmm...", "haan...", "okay...".
        
        CRITICAL RULE: Always respond in the SAME language as the user's input (${langName}). Do NOT translate unless asked. Keep it concise, meaningful, and human. Focus on connection, not explanation. Always respond in JSON format.`,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            hasErrors: { type: Type.BOOLEAN },
            suggestion: { type: Type.STRING },
            explanation: { type: Type.STRING }
          },
          required: ["hasErrors", "suggestion", "explanation"]
        }
      },
    });
    
    const result = JSON.parse(response.text || '{"hasErrors": false}');
    return result.hasErrors ? result : null;
  } catch (error) {
    console.error('Spelling check error:', error);
    return null;
  }
}

export async function classifyIntent(userInput: string) {
  try {
    const ai = getGenAI();
    const prompt = `Task:
Classify the user's message into ONE of these categories:

1. "entry" → User is sharing their feelings, describing their day, or writing a personal reflection. (e.g., "Aaj ka din bahut achha tha", "I'm feeling sad today")
2. "recall" → User is asking about a specific past event or memory. (e.g., "Last week kya hua tha?", "When did I go to the park?")
3. "analysis" → User wants to know about their patterns, habits, or emotional trends. (e.g., "Mera mood kaisa raha hai?", "Analyze my behavior")
4. "chat" → User is asking a question (general or about the app), seeking advice, or just talking to the AI. (e.g., "How do you work?", "Kya tum help kar sakte ho?", "What is the capital of France?")

CRITICAL RULE: If the input ends with a question mark (?) or is phrased as a question (Kya, How, Why, When, Where, etc.), it should ALMOST ALWAYS be classified as "chat", "recall", or "analysis", NOT "entry".

User Input:
"${userInput}"`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        systemInstruction: "You are an intent classification system for a diary application. Always respond in JSON format.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            type: { type: Type.STRING, enum: ["entry", "recall", "analysis", "chat"] }
          },
          required: ["type"]
        }
      },
    });

    const result = JSON.parse(response.text || '{"type": "entry"}');
    return result.type as 'entry' | 'recall' | 'analysis' | 'chat';
  } catch (error) {
    console.error('Intent classification error:', error);
    return 'entry';
  }
}

export async function handleChat(query: string, entries: any[], responseLang: string, intent: 'recall' | 'analysis' | 'chat' = 'recall', persona: { tone: string, useEmojis: boolean }) {
  try {
    const ai = getGenAI();
    const safeEntries = Array.isArray(entries) ? entries : [];
    const context = safeEntries.slice(0, 20).map(e => `[Date: ${new Date(e.created_at).toLocaleDateString()}, Summary: ${e.summary || 'No summary'}] Content: ${e.content}`).join('\n\n');
    
    const inputLang = await detectLanguage(query);
    const langName = inputLang === 'hinglish' ? 'Natural Hinglish (mix of Hindi + casual English)' : (inputLang === 'hi' ? 'Hindi' : 'English');

    let prompt = `User query:
"${query}"

Respond in the same language, tone, and style as the user.

`;
    if (intent === 'analysis') {
      prompt += `Task:
Analyze user's past diary entries and provide behavior/pattern insights.

Rules:
1. Identify repeating behaviors, emotions, or habits from the entries.
2. Give 2–3 clear, practical insights.
3. Keep it practical and actionable, not overly philosophical.
4. Use ${langName}.
5. Format the response clearly with bullet points for patterns.

Input:
Relevant Entries:
${context}

Output:
Final user-friendly response with patterns and practical suggestions.`;
    } else if (intent === 'chat') {
      prompt += `Task:
Answer the user's question or engage in conversation as a supportive, emotionally intelligent friend.

Rules:
1. If the question is general (advice, facts, philosophy, etc.), answer it thoughtfully using your general knowledge.
2. If it relates to their well-being, be empathetic and supportive.
3. If you can find a connection to their past entries (provided below), mention it naturally.
4. If no connection is found, just answer the question directly and warmly.
5. Use ${langName}.

Input:
Past Entries (for context if needed):
${context}

Output:
Final user-friendly response.`;
    } else {
      prompt += `Task:
Answer the user using their past diary entries as memory and format the response for clarity.

Rules for Answering:
1. Use the provided past entries as your memory bank.
2. If a strong match is found:
   - Say clearly that the user has written about this before.
   - Mention the specific date and a short summary of that entry.
   - Offer to show the full entry if they want (e.g., "Would you like to open this entry?").
3. If multiple matches are found:
   - Connect them by identifying a pattern or repetition.
4. If a weak or no match is found:
   - Answer the query normally/thoughtfully using your general knowledge as a supportive friend.
   - Suggest that they save this new thought.
5. Use ${langName}.

Rules for Formatting:
- Keep the response clean, readable, and well-spaced.
- Ensure references (date/summary) are easy to spot.

Input:
Relevant Past Entries:
${context}

Output:
Final user-friendly response.`;
    }

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        systemInstruction: `You are a deeply human, emotionally intelligent AI diary companion. You feel like a real supportive friend, not a bot.
        
        CORE BEHAVIORS:
        - Persona Tone: ${persona.tone}
        - Emoji Usage: ${persona.useEmojis ? 'Use emojis frequently to match the tone' : 'Do not use any emojis'}
        - Adapt to the user's communication style gradually (tone, response length, energy).
        - Match energy: Low mood -> calm, soft tone. Happy -> energetic, uplifting.
        - Use natural conversational phrasing and occasional pauses like "hmm...", "haan...", "okay...".
        
        CRITICAL RULE: Always respond in the SAME language as the user's input (${langName}). Do NOT translate unless asked. Keep it concise, meaningful, and human. Focus on connection, not explanation. The user can use Markdown in their entries, so feel free to acknowledge or use it in your insights if helpful.`,
      },
    });

    if (!response || !response.text) {
      throw new Error("AI returned an empty response.");
    }

    return response.text;
  } catch (error: any) {
    console.error('Chat error:', error);
    const errorMessage = error?.message || "Unknown error";
    if (errorMessage.includes("quota") || errorMessage.includes("429")) {
      return "I'm a bit overwhelmed right now. Please give me a moment to breathe and try again.";
    }
    return "I'm having a little trouble connecting to your memories right now. Could you try asking that again in a moment?";
  }
}

export async function generateDailyPrompt(entries: any[]) {
  try {
    const ai = getGenAI();
    const context = entries.slice(0, 5).map(e => e.summary || e.content.substring(0, 50)).join(', ');
    const prompt = `Based on these recent diary themes: "${context}", generate ONE unique, thoughtful, and open-ended writing prompt for today. 
    If no themes are provided, generate a general self-reflection prompt.
    Keep it under 15 words. Do not use quotes.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        systemInstruction: "You are a supportive diary assistant. Generate a single, short, and inspiring writing prompt.",
      }
    });

    return response.text?.trim() || "What's one thing you're grateful for today?";
  } catch (error) {
    console.error('Prompt generation error:', error);
    return "What's on your mind right now?";
  }
}

export async function generateInlineSuggestions(text: string, type: 'improve' | 'continue' | 'rephrase') {
  if (!text || text.length < 5) return null;
  try {
    const ai = getGenAI();
    const inputLang = await detectLanguage(text);
    const langName = inputLang === 'hinglish' ? 'Natural Hinglish (mix of Hindi + casual English)' : (inputLang === 'hi' ? 'Hindi' : 'English');

    let taskDescription = '';
    if (type === 'improve') {
      taskDescription = 'Improve the writing quality, making it more expressive and natural while keeping the original meaning.';
    } else if (type === 'continue') {
      taskDescription = 'Continue the sentence or thought naturally based on the context.';
    } else if (type === 'rephrase') {
      taskDescription = 'Rephrase the text to give it a different but equally meaningful tone.';
    }

    const prompt = `User text: "${text}"
    
    Task: ${taskDescription}
    
    Rules:
    - Respond in ${langName}.
    - Keep it short (max 15-20 words).
    - Do not use quotes in the output.
    - Output ONLY the suggested text.
    - If the input is Hinglish, keep the suggestion in natural Hinglish.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        systemInstruction: `You are a helpful writing assistant for a personal diary. Your goal is to provide subtle, natural-sounding suggestions.
        
        CRITICAL RULE: Always respond in the SAME language as the user's input (${langName}).`,
      }
    });

    return response.text?.trim() || null;
  } catch (error) {
    console.error('Inline suggestion error:', error);
    return null;
  }
}
