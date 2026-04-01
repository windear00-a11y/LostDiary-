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
    const prompt = `Detect the primary language of the following text. If the text is mixed (like Hinglish), classify based on meaning, not words.

Examples:
- "kal meeting hai" → Hindi
- "today mood off hai" → Hindi
- "I am feeling acha today" → Hindi
- "I am feeling good today" → English

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
    if (result === 'hi' || result === 'hinglish' || result === 'es') {
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

export async function generateAIInsight(normalizedContent: string, responseLang: string) {
  try {
    const ai = getGenAI();
    const prompt = `Analyze this diary entry: "${normalizedContent}". 
    Provide:
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

    const langName = responseLang === 'hinglish' ? 'Hinglish (a mix of Hindi and English written in Latin script)' : `the language with ISO code '${responseLang}'`;
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        systemInstruction: `You are WinDear, a compassionate and intelligent AI diary assistant. Your goal is to provide deep psychological insights, detect subtle mood shifts, and offer gentle, actionable growth suggestions based on a user's diary entry. Keep your tone human, soft, and encouraging. Always respond in JSON format. You MUST write your response (mood, insight, suggestion, summary) in ${langName}.`,
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
    const responseLang = settings.response_language || 'en';
    const langName = responseLang === 'hinglish' ? 'Hinglish (a mix of Hindi and English written in Latin script)' : `the language with ISO code '${responseLang}'`;

    const prompt = `
    Analyze this diary entry: "${text}".
    
    Current User Settings:
    - Input Language: ${settings.understand_language}
    - Response Language: ${responseLang}

    Tasks:
    1. Detect the input language (if set to "auto").
    2. Normalize the content:
       - If input is Hinglish, convert to clean, natural Hinglish (Latin script).
       - If input is English/Mixed, convert to clean, natural English.
    3. Translate the normalized content to the response language (${responseLang}).
    4. Generate AI Insights:
       - mood: Choose ONE: Happy, Sad, Stressed, Neutral.
       - insight: A thoughtful, empathetic paragraph (2-3 sentences) in ${langName}.
       - suggestion: A small, actionable step for growth in ${langName}.
       - summary: A short summary (2-3 lines) in ${langName}.

    Response format (JSON):
    {
      "detected_language": "string",
      "normalized_content": "string",
      "translated_content": "string",
      "mood": "string",
      "insight": "string",
      "suggestion": "string",
      "summary": "string"
    }`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        systemInstruction: `You are WinDear, a compassionate and intelligent AI diary assistant. Your goal is to provide deep psychological insights and emotional clarity. Always respond in JSON format. You MUST write the insight, suggestion, and summary in ${langName}.`,
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
            summary: { type: Type.STRING }
          },
          required: ["detected_language", "normalized_content", "translated_content", "mood", "insight", "suggestion", "summary"]
        }
      },
    });

    return JSON.parse(response.text || '{}');
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

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ role: "user", parts: [{ text: combinedText }] }],
      config: {
        systemInstruction: `You are an insightful emotional intelligence coach. 
Analyze the user's diary entries from the last 7 days.
Generate a structured weekly reflection:
- trend: A calm summary of the emotional trajectory (e.g., "Finding balance", "Increasing stress", "Steady growth")
- pattern: One key recurring theme or behavior observed in the writing
- suggestion: One gentle, practical suggestion for the coming week
- Max 100 words total
- Tone: Calm, non-judgmental, insightful
- Avoid generic summaries`,
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

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ role: "user", parts: [{ text: `Analyze these diary entries from the last month and provide a "Growth Journey" summary.
Focus on:
- How the user's perspective or emotional state has evolved.
- One positive shift in their writing or thinking.
- Keep it calm, supportive, and non-judgmental.
- Max 60 words.
- No bullet points, just a short paragraph.

Entries:
${last30Days}` }] }],
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
    const prompt = `Check the following diary entry for spelling and grammar errors. 
    If there are significant errors, provide a corrected version. 
    If the text is mostly correct, return hasErrors: false.
    Focus on obvious typos and clear grammatical mistakes.
    Preserve the original tone and style.
    
    Text: "${text}"`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        systemInstruction: "You are a helpful writing assistant. Your goal is to identify clear spelling and grammar errors in diary entries. Always respond in JSON format.",
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
